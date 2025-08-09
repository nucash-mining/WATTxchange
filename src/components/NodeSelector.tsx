import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import axios from 'axios';
import { checkAltcoinchainNode } from '../services/web3Service';

Modal.setAppElement('#root');

function NodeSelector() {
  const [nodes, setNodes] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [systemSpecs, setSystemSpecs] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [altcoinchainConnected, setAltcoinchainConnected] = useState<boolean | null>(null);

  useEffect(() => {
    // Fetch nodes and system specs
    axios.get('http://localhost:5000/api/nodes').then((res) => setNodes(Object.values(res.data)));
    axios.get('http://localhost:5000/api/system-specs').then((res) => setSystemSpecs(res.data));
    // Check Altcoinchain node connection
    checkAltcoinchainNode().then(setAltcoinchainConnected);
  }, []);

  const handleNodeSelect = (node) => {
    setSelectedNodes((prev) =>
      prev.includes(node.name) ? prev.filter((n) => n !== node.name) : [...prev, node.name]
    );
  };

  const openModal = () => setModalIsOpen(true);
  const closeModal = () => setModalIsOpen(false);

  const handleInstall = async () => {
    const response = await axios.post('http://localhost:5000/api/install-nodes', {
      nodes: selectedNodes,
      enableMoneroMining: document.getElementById('monero-mining')?.checked || false,
    });
    if (selectedNodes.includes('Monero') && document.getElementById('monero-mining')?.checked) {
      await axios.post('http://localhost:5000/api/start-monero-mining');
    }
    alert(response.data.commands);
    closeModal();
  };

  const totalStorage = selectedNodes.reduce((sum, nodeName) => {
    const node = nodes.find((n) => n.name === nodeName);
    return sum + parseFloat(node?.storage || 0);
  }, 0);

  return (
    <div>
      <h2>Select Blockchain Nodes</h2>
      {altcoinchainConnected !== null && (
        <p>Altcoinchain Node Status: {altcoinchainConnected ? 'Connected' : 'Disconnected'}</p>
      )}
      {systemSpecs && (
        <div>
          <h3>Your System Specs</h3>
          <p>OS: {systemSpecs.os}</p>
          <p>CPU: {systemSpecs.cpuModel} ({systemSpecs.cpuCores} cores)</p>
          <p>RAM: {systemSpecs.totalRam.toFixed(2)}GB (Free: {systemSpecs.freeRam.toFixed(2)}GB)</p>
          <p>Disk: {systemSpecs.totalDisk.toFixed(2)}GB (Free: {systemSpecs.freeDisk.toFixed(2)}GB)</p>
        </div>
      )}
      <h3>Available Nodes</h3>
      <ul>
        {nodes.map((node) => (
          <li key={node.name}>
            <input
              type="checkbox"
              checked={selectedNodes.includes(node.name)}
              onChange={() => handleNodeSelect(node)}
            />
            {node.name} (Storage: {node.storage}, RAM: {node.ram}, CPU: {node.cpu}, Network: {node.network})
            {node.mining && <span> [Mining Available]</span>}
          </li>
        ))}
      </ul>
      <button onClick={openModal} disabled={!selectedNodes.length}>
        Install Selected Nodes
      </button>
      <Modal isOpen={modalIsOpen} onRequestClose={closeModal}>
        <h2>Install Nodes</h2>
        <p>Selected Nodes: {selectedNodes.join(', ')}</p>
        <p>Total Storage Required: {totalStorage}GB</p>
        {systemSpecs && totalStorage > systemSpecs.freeDisk && (
          <p style={{ color: 'red' }}>Warning: Insufficient disk space ({systemSpecs.freeDisk.toFixed(2)}GB available)</p>
        )}
        {selectedNodes.includes('Monero') && (
          <div>
            <h3>Monero Mining</h3>
            <input type="checkbox" id="monero-mining" />
            <label htmlFor="monero-mining">Enable Monero Mining</label>
          </div>
        )}
        <button onClick={handleInstall}>Confirm Installation</button>
        <button onClick={closeModal}>Cancel</button>
      </Modal>
    </div>
  );
}

export default NodeSelector;