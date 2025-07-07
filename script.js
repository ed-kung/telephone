class TelephoneNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.transmissionVariants = new Set();
        this.generations = 10;
        this.nodesPerGeneration = 1;
        this.connectionsPerNode = 1;
        this.corruptionProbability = 0.2;
        this.originalMessage = "In the beginning, God created the heavens and the earth.";
        this.selectedNode = null;
        
        this.setupEventListeners();
        this.loadFAQ();
    }
    
    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startSimulation());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        
        document.getElementById('corruption').addEventListener('input', (e) => {
            this.corruptionProbability = parseFloat(e.target.value);
            document.getElementById('corruption-value').textContent = this.corruptionProbability;
        });
        
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }
    
    reset() {
        this.nodes = [];
        this.connections = [];
        this.transmissionVariants = new Set();
        this.selectedNode = null;
        this.updateCanvasSize();
        this.clearCanvas();
        document.getElementById('selected-message').textContent = 'Click a node to see its message';
        document.getElementById('message-accuracy').textContent = '';
        document.getElementById('received-messages').innerHTML = '';
        this.clearErrorTable();
        this.clearVariantTable();
    }
    
    startSimulation() {
        this.generations = parseInt(document.getElementById('generations').value);
        this.nodesPerGeneration = parseInt(document.getElementById('nodes-per-generation').value);
        this.connectionsPerNode = parseInt(document.getElementById('connections').value);
        this.originalMessage = document.getElementById('message').value;
        
        this.reset();
        this.generateNetwork();
        this.simulateTransmission();
        this.drawNetwork();
        this.updateErrorDistribution();
        this.updateVariantDistribution();
    }
    
    updateCanvasSize() {
        const maxCanvasHeight = 600; // Original maximum height
        const margin = 50;
        
        // Calculate dynamic height based on maximum nodes per generation
        const maxNodesInAnyGeneration = Math.max(1, this.nodesPerGeneration);
        const nodeSpacing = 80; // Minimum spacing between nodes
        const dynamicHeight = Math.min(maxCanvasHeight, Math.max(200, maxNodesInAnyGeneration * nodeSpacing + 2 * margin));
        
        // Update canvas height
        this.canvas.height = dynamicHeight;
    }
    
    generateNetwork() {
        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const margin = 50;
        
        for (let generation = 0; generation < this.generations; generation++) {
            const nodesInGeneration = generation === 0 ? 1 : this.nodesPerGeneration;
            const x = margin + (generation * (canvasWidth - 2 * margin)) / (this.generations - 1);
            
            for (let i = 0; i < nodesInGeneration; i++) {
                const y = margin + (i * (canvasHeight - 2 * margin)) / Math.max(1, nodesInGeneration - 1);
                
                const node = {
                    id: this.nodes.length,
                    generation: generation,
                    x: x,
                    y: nodesInGeneration === 1 ? canvasHeight / 2 : y,
                    message: generation === 0 ? this.originalMessage : '',
                    accuracy: generation === 0 ? 1.0 : 0.0,
                    receivedMessages: []
                };
                
                this.nodes.push(node);
            }
        }
        
        this.generateConnections();
    }
    
    generateConnections() {
        for (let generation = 0; generation < this.generations - 1; generation++) {
            const currentGenNodes = this.nodes.filter(n => n.generation === generation);
            const nextGenNodes = this.nodes.filter(n => n.generation === generation + 1);
            
            currentGenNodes.forEach(node => {
                if (generation === 0) {
                    // Node 0 connects to ALL nodes in generation 1
                    nextGenNodes.forEach(targetNode => {
                        this.connections.push({
                            from: node,
                            to: targetNode
                        });
                    });
                } else {
                    // For subsequent generations, use K-limited connections
                    const shuffled = [...nextGenNodes].sort(() => 0.5 - Math.random());
                    const targetCount = Math.min(this.connectionsPerNode, nextGenNodes.length);
                    
                    for (let i = 0; i < targetCount; i++) {
                        this.connections.push({
                            from: node,
                            to: shuffled[i]
                        });
                    }
                }
            });
        }
    }
    
    simulateTransmission() {
        for (let generation = 1; generation < this.generations; generation++) {
            const currentGenNodes = this.nodes.filter(n => n.generation === generation);
            
            currentGenNodes.forEach(node => {
                const incomingConnections = this.connections.filter(conn => conn.to === node);
                
                incomingConnections.forEach(conn => {
                    let transmittedMessage;
                    if (conn.from.generation === 0) {
                        // No corruption from node 0 to generation 1
                        transmittedMessage = conn.from.message;
                    } else {
                        // Apply corruption for subsequent generations
                        transmittedMessage = this.corruptMessage(conn.from.message);
                        // Track this variant (exclude generation 0 to 1 transmissions)
                        this.transmissionVariants.add(transmittedMessage);
                    }
                    node.receivedMessages.push(transmittedMessage);
                });
                
                node.message = this.reconstructMessage(node.receivedMessages);
                node.accuracy = this.calculateAccuracy(node.message, this.originalMessage);
            });
        }
    }
    
    corruptMessage(message) {
        const words = message.split(' ');
        const corruptedWords = words.map(word => {
            if (Math.random() < this.corruptionProbability) {
                return this.corruptWord(word);
            }
            return word;
        });
        
        return corruptedWords.join(' ');
    }
    
    corruptWord(word) {
        const corruptions = [
            () => word.slice(0, -1),
            () => word + this.getRandomChar(),
            () => word.split('').sort(() => 0.5 - Math.random()).join(''),
            () => word.replace(/[aeiou]/g, this.getRandomChar())
        ];
        
        const corruption = corruptions[Math.floor(Math.random() * corruptions.length)];
        return corruption();
    }
    
    getRandomChar() {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        return chars[Math.floor(Math.random() * chars.length)];
    }
    
    getRandomWord() {
        const words = ['cat', 'dog', 'bird', 'fish', 'tree', 'rock', 'sky', 'sun', 'moon', 'star'];
        return words[Math.floor(Math.random() * words.length)];
    }
    
    reconstructMessage(receivedMessages) {
        if (receivedMessages.length === 0) return '';
        if (receivedMessages.length === 1) return receivedMessages[0];
        
        const wordFrequency = {};
        receivedMessages.forEach(message => {
            const words = message.split(' ');
            words.forEach((word, index) => {
                if (!wordFrequency[index]) wordFrequency[index] = {};
                wordFrequency[index][word] = (wordFrequency[index][word] || 0) + 1;
            });
        });
        
        const reconstructed = [];
        for (const position in wordFrequency) {
            const words = wordFrequency[position];
            const mostFrequent = Object.keys(words).reduce((a, b) => words[a] > words[b] ? a : b);
            reconstructed[position] = mostFrequent;
        }
        
        return reconstructed.join(' ');
    }
    
    calculateAccuracy(message1, message2) {
        const words1 = message1.toLowerCase().split(' ');
        const words2 = message2.toLowerCase().split(' ');
        const maxLength = Math.max(words1.length, words2.length);
        
        let matches = 0;
        for (let i = 0; i < maxLength; i++) {
            if (words1[i] === words2[i]) {
                matches++;
            }
        }
        
        return maxLength > 0 ? matches / maxLength : 0;
    }
    
    drawNetwork() {
        this.clearCanvas();
        
        this.connections.forEach(conn => {
            this.drawConnection(conn.from, conn.to);
        });
        
        this.nodes.forEach(node => {
            this.drawNode(node);
        });
    }
    
    drawConnection(fromNode, toNode) {
        this.ctx.beginPath();
        this.ctx.moveTo(fromNode.x, fromNode.y);
        this.ctx.lineTo(toNode.x, toNode.y);
        this.ctx.strokeStyle = '#ddd';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    drawNode(node) {
        const radius = 15;
        const color = this.getNodeColor(node.accuracy);
        
        this.ctx.beginPath();
        this.ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        if (node === this.selectedNode) {
            this.ctx.strokeStyle = '#2c3e50';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
        
        this.ctx.fillStyle = '#333';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.id, node.x, node.y + 4);
    }
    
    getNodeColor(accuracy) {
        if (accuracy >= 0.8) return '#4CAF50';
        if (accuracy >= 0.5) return '#FFC107';
        if (accuracy >= 0.2) return '#FF9800';
        return '#F44336';
    }
    
    handleCanvasClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const clickedNode = this.nodes.find(node => {
            const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
            return distance <= 15;
        });
        
        if (clickedNode) {
            this.selectedNode = clickedNode;
            this.displayNodeInfo(clickedNode);
            this.drawNetwork();
        }
    }
    
    displayNodeInfo(node) {
        document.getElementById('selected-message').textContent = node.message || 'No message';
        document.getElementById('message-accuracy').textContent = 
            `Accuracy: ${(node.accuracy * 100).toFixed(1)}% | Generation: ${node.generation} | Node ID: ${node.id}`;
        
        const receivedMessagesDiv = document.getElementById('received-messages');
        if (node.receivedMessages && node.receivedMessages.length > 0) {
            receivedMessagesDiv.innerHTML = `
                <h4>Received Messages (${node.receivedMessages.length}):</h4>
                ${node.receivedMessages.map((msg, index) => `
                    <div class="received-message">
                        <strong>Message ${index + 1}:</strong> ${msg}
                    </div>
                `).join('')}
            `;
        } else {
            receivedMessagesDiv.innerHTML = node.generation === 0 ? 
                '<h4>Original Message Source</h4>' : 
                '<h4>No messages received</h4>';
        }
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    countWordErrors(message1, message2) {
        const words1 = message1.toLowerCase().split(' ').filter(word => word.trim() !== '');
        const words2 = message2.toLowerCase().split(' ').filter(word => word.trim() !== '');
        const maxLength = Math.max(words1.length, words2.length);
        
        let errors = 0;
        for (let i = 0; i < maxLength; i++) {
            if (words1[i] !== words2[i]) {
                errors++;
            }
        }
        
        return errors;
    }
    
    updateErrorDistribution() {
        const finalGeneration = Math.max(...this.nodes.map(n => n.generation));
        const finalNodes = this.nodes.filter(n => n.generation === finalGeneration);
        
        if (finalNodes.length === 0) {
            this.clearErrorTable();
            return;
        }
        
        const errorCounts = {};
        finalNodes.forEach(node => {
            const errors = this.countWordErrors(node.message, this.originalMessage);
            errorCounts[errors] = (errorCounts[errors] || 0) + 1;
        });
        
        const tableBody = document.getElementById('error-table-body');
        tableBody.innerHTML = '';
        
        const sortedErrors = Object.keys(errorCounts).sort((a, b) => parseInt(a) - parseInt(b));
        
        sortedErrors.forEach(errorCount => {
            const count = errorCounts[errorCount];
            const percentage = ((count / finalNodes.length) * 100).toFixed(1);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${errorCount} error${errorCount == 1 ? '' : 's'}</td>
                <td>${count} (${percentage}%)</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    clearErrorTable() {
        const tableBody = document.getElementById('error-table-body');
        tableBody.innerHTML = '<tr><td colspan="2">Run simulation to see results</td></tr>';
    }
    
    updateVariantDistribution() {
        const uniqueVariants = Array.from(this.transmissionVariants);
        
        if (uniqueVariants.length === 0) {
            this.clearVariantTable();
            return;
        }
        
        const errorCounts = {};
        uniqueVariants.forEach(variant => {
            const errors = this.countWordErrors(variant, this.originalMessage);
            errorCounts[errors] = (errorCounts[errors] || 0) + 1;
        });
        
        document.getElementById('variant-summary').textContent = 
            `Total variants: ${uniqueVariants.length}`;
        
        const tableBody = document.getElementById('variant-table-body');
        tableBody.innerHTML = '';
        
        const sortedErrors = Object.keys(errorCounts).sort((a, b) => parseInt(a) - parseInt(b));
        
        sortedErrors.forEach(errorCount => {
            const count = errorCounts[errorCount];
            const percentage = ((count / uniqueVariants.length) * 100).toFixed(1);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${errorCount} error${errorCount == 1 ? '' : 's'}</td>
                <td>${count} (${percentage}%)</td>
            `;
            tableBody.appendChild(row);
        });
    }
    
    clearVariantTable() {
        document.getElementById('variant-summary').textContent = 'Total variants: 0';
        const tableBody = document.getElementById('variant-table-body');
        tableBody.innerHTML = '<tr><td colspan="2">Run simulation to see results</td></tr>';
    }
    
    async loadFAQ() {
        try {
            const response = await fetch('README.md');
            const markdownText = await response.text();
            const htmlContent = this.convertMarkdownToHTML(markdownText);
            document.getElementById('faq-content').innerHTML = htmlContent;
        } catch (error) {
            console.error('Error loading FAQ:', error);
            document.getElementById('faq-content').innerHTML = '<p>Error loading FAQ content.</p>';
        }
    }
    
    convertMarkdownToHTML(markdown) {
        // Simple markdown to HTML conversion
        let html = markdown
            // Headers
            .replace(/^### (.*$)/gm, '<h3>$1</h3>')
            .replace(/^## (.*$)/gm, '<h2>$1</h2>')
            .replace(/^# (.*$)/gm, '<h1>$1</h1>')
            // Bold
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code
            .replace(/`(.*?)`/g, '<code>$1</code>')
            // Line breaks
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>');
        
        // Wrap in paragraphs
        html = '<p>' + html + '</p>';
        
        // Clean up empty paragraphs and fix header paragraphs
        html = html
            .replace(/<p><\/p>/g, '')
            .replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1')
            .replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<br>/g, '$1')
            .replace(/<br><\/p>/g, '</p>');
        
        return html;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TelephoneNetwork('network-canvas');
});