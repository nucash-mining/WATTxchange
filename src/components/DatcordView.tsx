import React, { useState } from 'react';
import { motion } from 'framer-motion';
import DatcordLogo from './DatcordLogo';
import { Lock, Coins, Server, ExternalLink, Sparkles, Info, Maximize2 } from 'lucide-react';

/**
 * Datcord — a Discord-shaped chat client whose messages are WATTx transactions.
 *
 * Log in with your existing Discord account (identity only: Discord's API does not let a
 * third-party client read or send your Discord messages, and using a user token to do it
 * anyway violates Discord's terms). Every Datcord message is encrypted end to end with
 * secp256k1 ECDH + AES-256-GCM and written to the WATTx chain, so only the people holding
 * the key can read it.
 */

const DATCORD_SITE_URL = import.meta.env.VITE_DATCORD_URL ?? 'https://datcord.wattxchange.app';
const DATCORD_REPO_URL = 'https://github.com/nucash-mining/datcord.js';
// The Datcord client (the same build that ships as the Android app), served from this
// site's public/datcord-app/. Rebuild it with scripts/sync-datcord-app.sh.
const DATCORD_APP_URL = `${import.meta.env.BASE_URL}datcord-app/index.html`;
const DATCORD_TERMS_URL = `${DATCORD_SITE_URL}/terms/`;
const DATCORD_PRIVACY_URL = `${DATCORD_SITE_URL}/privacy/`;

const features = [
  {
    icon: Lock,
    title: 'End-to-end encrypted, on chain',
    body: 'secp256k1 ECDH derives a shared secret, AES-256-GCM encrypts the message, and the ciphertext is written to WATTx in OP_RETURN outputs. The same format the WATTx wallet uses, so messages are readable there too.',
  },
  {
    icon: Server,
    title: 'One transaction per channel message',
    body: 'Channels have their own symmetric key and their own address, so a message costs a single transaction no matter how many people read it. Direct messages use ECDH between the two parties.',
  },
  {
    icon: Coins,
    title: 'Datcord Nitro pays your fees',
    body: 'Posting costs a real transaction fee. A Nitro subscription, paid in WTX, funds a monthly fee allowance that tops up your messaging address, and unlocks image, audio and video attachments.',
  },
  {
    icon: Sparkles,
    title: 'Your keys, your messages',
    body: 'The messaging key is generated on your device and stored encrypted. Transactions are signed locally, so no server can read your messages or spend your coins.',
  },
];

const DatcordView: React.FC = () => {
  const [showAbout, setShowAbout] = useState(false);
  return (
  <div className="space-y-6">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
    >
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
          <DatcordLogo className="w-12 h-12" />
        </div>
        <div>
          <h2 className="text-3xl font-bold">Datcord</h2>
          <p className="text-slate-400">
            Discord login, WATTx encrypted messaging. Your chat, on your chain.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowAbout((v) => !v)}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors font-medium"
        >
          <Info className="w-4 h-4" /> {showAbout ? 'Hide info' : 'About'}
        </button>
        <a
          href={DATCORD_APP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors font-medium"
        >
          Full window <Maximize2 className="w-4 h-4" />
        </a>
        <a
          href={DATCORD_SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition-colors font-medium"
        >
          Get Datcord <ExternalLink className="w-4 h-4" />
        </a>
        <a
          href={DATCORD_REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors font-medium"
        >
          Source <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden border border-slate-800 bg-[#313338]"
    >
      <iframe
        src={DATCORD_APP_URL}
        title="Datcord"
        className="w-full block h-[calc(100vh-14rem)] min-h-[560px]"
        allow="clipboard-write; clipboard-read"
      />
    </motion.div>

    {showAbout && (<>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {features.map((feature, index) => (
        <motion.div
          key={feature.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06 }}
          className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800"
        >
          <div className="flex items-center gap-3 mb-3">
            <feature.icon className="w-5 h-5 text-indigo-400" />
            <h3 className="font-semibold text-lg">{feature.title}</h3>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed">{feature.body}</p>
        </motion.div>
      ))}
    </div>

    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="bg-slate-900/50 backdrop-blur-sm rounded-xl p-6 border border-slate-800"
    >
      <h3 className="font-semibold text-lg mb-4">Nitro tiers</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: 'Free', price: '0 WTX', notes: ['Text messages', 'You pay your own fees'] },
          { name: 'Datcord Basic', price: '25 WTX / 30 days', notes: ['5 WTX fee allowance', 'Attachments up to 2 MB', '25 emoji slots'] },
          { name: 'Datcord Nitro', price: '75 WTX / 30 days', notes: ['20 WTX fee allowance', 'Attachments up to 25 MB', '250 emoji slots', 'Priority fee rate'] },
        ].map((tier) => (
          <div key={tier.name} className="rounded-lg border border-slate-800 p-4">
            <div className="font-medium">{tier.name}</div>
            <div className="text-indigo-400 text-sm mb-3">{tier.price}</div>
            <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
              {tier.notes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Subscriptions are paid on chain to a deposit address unique to your Discord account,
        and the fee allowance is disbursed back to your messaging address as you post.
      </p>
      <p className="text-xs text-slate-500 mt-3">
        <a href={DATCORD_TERMS_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 underline">
          Terms of Service
        </a>
        {' · '}
        <a href={DATCORD_PRIVACY_URL} target="_blank" rel="noopener noreferrer" className="hover:text-slate-300 underline">
          Privacy Policy
        </a>
        {' · Datcord is independent and not affiliated with Discord Inc.'}
      </p>
    </motion.div>
    </>)}
  </div>
  );
};

export default DatcordView;
