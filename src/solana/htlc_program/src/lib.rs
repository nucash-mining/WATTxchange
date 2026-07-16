//! WATTxchange HTLC program for Solana — the SOL leg of the trust-minimized
//! bridge. Mirrors contracts/src/HTLCVault.sol exactly: funds locked under a
//! sha256(preimage) hashlock move only (a) to the recipient with the preimage
//! before the timeout, or (b) back to the sender after it. No authority key,
//! no upgrade path (deploy with `--final`), no third code path.
//!
//! The hashlock is SHA-256 — the same digest the EVM vault and Bitcoin-script
//! HTLCs use — so one secret drives an EVM<->SOL (or BTC<->SOL) atomic swap.
//!
//! Native program (no Anchor) to keep the audit surface minimal.
//!
//! Accounts / instructions:
//!   0 = Lock   { hashlock: [u8;32], timeout: i64, amount: u64, recipient: Pubkey, nonce: u64 }
//!       accounts: [sender (signer, writable), swap PDA (writable), system]
//!   1 = Claim  { preimage: [u8;32] }
//!       accounts: [recipient (signer, writable), swap PDA (writable)]
//!   2 = Refund {}
//!       accounts: [sender (signer, writable), swap PDA (writable)]
//!
//! The swap PDA is derived from
//!   ["htlc", sender, recipient, hashlock, timeout_le, amount_le, nonce_le]
//! so every parameter is bound into the account address (the Solana analogue
//! of the EVM vault's swapID) and a lock can never be replayed or collided.

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    hash::hashv, // sha256
    msg,
    program::invoke_signed,
    program_error::ProgramError,
    pubkey::Pubkey,
    rent::Rent,
    system_instruction,
    sysvar::{clock::Clock, Sysvar},
};

entrypoint!(process_instruction);

/// Lock state stored in the swap PDA (fixed 106-byte layout).
/// stage: 1 = LOCKED, 2 = CLAIMED, 3 = REFUNDED
struct SwapState;
impl SwapState {
    const LEN: usize = 1 + 32 + 32 + 32 + 8 + 1; // stage, sender, recipient, hashlock, timeout, bump
    const STAGE: usize = 0;
    const SENDER: usize = 1;
    const RECIPIENT: usize = 33;
    const HASHLOCK: usize = 65;
    const TIMEOUT: usize = 97;
    const BUMP: usize = 105;
}

const MIN_DURATION: i64 = 60 * 60; // 1 hour
const MAX_DURATION: i64 = 60 * 60 * 24 * 30; // 30 days

pub fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    data: &[u8],
) -> ProgramResult {
    match data.first() {
        Some(0) => lock(program_id, accounts, &data[1..]),
        Some(1) => claim(program_id, accounts, &data[1..]),
        Some(2) => refund(program_id, accounts),
        _ => Err(ProgramError::InvalidInstructionData),
    }
}

fn pda_seeds<'a>(
    sender: &'a Pubkey,
    recipient: &'a Pubkey,
    hashlock: &'a [u8; 32],
    timeout_le: &'a [u8; 8],
    amount_le: &'a [u8; 8],
    nonce_le: &'a [u8; 8],
) -> [&'a [u8]; 7] {
    [
        b"htlc",
        sender.as_ref(),
        recipient.as_ref(),
        hashlock,
        timeout_le,
        amount_le,
        nonce_le,
    ]
}

fn lock(program_id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    // hashlock(32) + timeout(8) + amount(8) + recipient(32) + nonce(8)
    if data.len() != 88 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let iter = &mut accounts.iter();
    let sender = next_account_info(iter)?;
    let swap = next_account_info(iter)?;
    let system = next_account_info(iter)?;

    if !sender.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    let hashlock: [u8; 32] = data[0..32].try_into().unwrap();
    let timeout = i64::from_le_bytes(data[32..40].try_into().unwrap());
    let amount = u64::from_le_bytes(data[40..48].try_into().unwrap());
    let recipient = Pubkey::new_from_array(data[48..80].try_into().unwrap());
    let nonce_le: [u8; 8] = data[80..88].try_into().unwrap();

    if amount == 0 || hashlock == [0u8; 32] {
        return Err(ProgramError::InvalidInstructionData);
    }
    let now = Clock::get()?.unix_timestamp;
    if timeout < now + MIN_DURATION || timeout > now + MAX_DURATION {
        return Err(ProgramError::InvalidInstructionData);
    }

    let timeout_le = timeout.to_le_bytes();
    let amount_le = amount.to_le_bytes();
    let seeds = pda_seeds(sender.key, &recipient, &hashlock, &timeout_le, &amount_le, &nonce_le);
    let (expected, bump) = Pubkey::find_program_address(&seeds, program_id);
    if expected != *swap.key {
        return Err(ProgramError::InvalidSeeds);
    }
    if !swap.data_is_empty() || swap.lamports() > 0 {
        // account already used — a duplicate lock with identical params
        return Err(ProgramError::AccountAlreadyInitialized);
    }

    // create the PDA holding state rent + the locked amount
    let rent = Rent::get()?.minimum_balance(SwapState::LEN);
    let mut signer_seeds: Vec<&[u8]> = seeds.to_vec();
    let bump_arr = [bump];
    signer_seeds.push(&bump_arr);
    invoke_signed(
        &system_instruction::create_account(
            sender.key,
            swap.key,
            rent + amount,
            SwapState::LEN as u64,
            program_id,
        ),
        &[sender.clone(), swap.clone(), system.clone()],
        &[&signer_seeds],
    )?;

    let mut state = swap.try_borrow_mut_data()?;
    state[SwapState::STAGE] = 1;
    state[SwapState::SENDER..SwapState::SENDER + 32].copy_from_slice(sender.key.as_ref());
    state[SwapState::RECIPIENT..SwapState::RECIPIENT + 32].copy_from_slice(recipient.as_ref());
    state[SwapState::HASHLOCK..SwapState::HASHLOCK + 32].copy_from_slice(&hashlock);
    state[SwapState::TIMEOUT..SwapState::TIMEOUT + 8].copy_from_slice(&timeout_le);
    state[SwapState::BUMP] = bump;

    msg!("htlc: locked");
    Ok(())
}

fn claim(program_id: &Pubkey, accounts: &[AccountInfo], data: &[u8]) -> ProgramResult {
    if data.len() != 32 {
        return Err(ProgramError::InvalidInstructionData);
    }
    let iter = &mut accounts.iter();
    let recipient = next_account_info(iter)?;
    let swap = next_account_info(iter)?;

    if swap.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    if !recipient.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    {
        let state = swap.try_borrow_data()?;
        if state[SwapState::STAGE] != 1 {
            return Err(ProgramError::InvalidAccountData);
        }
        if &state[SwapState::RECIPIENT..SwapState::RECIPIENT + 32] != recipient.key.as_ref() {
            return Err(ProgramError::IllegalOwner);
        }
        let timeout = i64::from_le_bytes(state[SwapState::TIMEOUT..SwapState::TIMEOUT + 8].try_into().unwrap());
        if Clock::get()?.unix_timestamp >= timeout {
            return Err(ProgramError::InvalidAccountData); // too late to claim
        }
        let digest = hashv(&[data]); // sha256(preimage) — matches the EVM leg
        if digest.to_bytes() != state[SwapState::HASHLOCK..SwapState::HASHLOCK + 32] {
            return Err(ProgramError::InvalidInstructionData);
        }
    }

    // mark claimed, publish the preimage in the transaction (the log + the
    // instruction itself reveal it), then pay out everything incl. rent
    swap.try_borrow_mut_data()?[SwapState::STAGE] = 2;
    payout(swap, recipient)?;
    msg!("htlc: claimed");
    Ok(())
}

fn refund(program_id: &Pubkey, accounts: &[AccountInfo]) -> ProgramResult {
    let iter = &mut accounts.iter();
    let sender = next_account_info(iter)?;
    let swap = next_account_info(iter)?;

    if swap.owner != program_id {
        return Err(ProgramError::IncorrectProgramId);
    }
    if !sender.is_signer {
        return Err(ProgramError::MissingRequiredSignature);
    }

    {
        let state = swap.try_borrow_data()?;
        if state[SwapState::STAGE] != 1 {
            return Err(ProgramError::InvalidAccountData);
        }
        if &state[SwapState::SENDER..SwapState::SENDER + 32] != sender.key.as_ref() {
            return Err(ProgramError::IllegalOwner);
        }
        let timeout = i64::from_le_bytes(state[SwapState::TIMEOUT..SwapState::TIMEOUT + 8].try_into().unwrap());
        if Clock::get()?.unix_timestamp < timeout {
            return Err(ProgramError::InvalidAccountData); // too early to refund
        }
    }

    swap.try_borrow_mut_data()?[SwapState::STAGE] = 3;
    payout(swap, sender)?;
    msg!("htlc: refunded");
    Ok(())
}

/// Move the PDA's full lamport balance (locked amount + rent) to `to`.
/// Zeroing the balance lets the runtime garbage-collect the account, which
/// also makes the swap unreplayable.
fn payout(swap: &AccountInfo, to: &AccountInfo) -> ProgramResult {
    let amount = swap.lamports();
    **swap.try_borrow_mut_lamports()? = 0;
    **to.try_borrow_mut_lamports()? = to
        .lamports()
        .checked_add(amount)
        .ok_or(ProgramError::ArithmeticOverflow)?;
    Ok(())
}
