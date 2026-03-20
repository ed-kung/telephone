class TelephoneNetwork {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.transmissionVariants = new Set();
        this.currentGeneration = 0;
        this.maxGenerations = 30;
        this.nodesPerGeneration = 1;
        this.connectionsPerNode = 1;
        this.corruptionProbability = 0.2;
        this.originalMessage = "In the beginning, God created the heavens and the earth.";
        this.selectedNode = null;
        this.started = false;

        this.setupEventListeners();
        this.loadFAQ();
    }

    setupEventListeners() {
        document.getElementById('start-btn').addEventListener('click', () => this.startSimulation());
        document.getElementById('next-gen-btn').addEventListener('click', () => this.addGeneration());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());

        document.getElementById('corruption').addEventListener('input', (e) => {
            this.corruptionProbability = parseFloat(e.target.value);
            document.getElementById('corruption-value').textContent = this.corruptionProbability.toFixed(2);
        });

        document.getElementById('nodes-per-generation').addEventListener('input', () => this.validateKN());
        document.getElementById('connections').addEventListener('input', () => this.validateKN());


        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('touchend', (e) => this.handleCanvasTouch(e));
    }

    validateKN() {
        const n = parseInt(document.getElementById('nodes-per-generation').value);
        const k = parseInt(document.getElementById('connections').value);
        const nError = document.getElementById('n-error');
        const kError = document.getElementById('k-error');
        let valid = true;

        if (n < 1) {
            nError.textContent = 'N must be at least 1';
            valid = false;
        } else if (n > 20) {
            nError.textContent = 'N cannot be greater than 20';
            valid = false;
        } else {
            nError.textContent = '';
        }

        if (k < 1) {
            kError.textContent = 'K must be at least 1';
            valid = false;
        } else if (k > 20) {
            kError.textContent = 'K cannot be greater than 20';
            valid = false;
        } else if (k > n) {
            kError.textContent = 'K cannot be greater than N';
            valid = false;
        } else {
            kError.textContent = '';
        }

        return valid;
    }

    reset() {
        this.nodes = [];
        this.connections = [];
        this.transmissionVariants = new Set();
        this.currentGeneration = 0;
        this.selectedNode = null;
        this.started = false;
        this.updateCanvasSize();
        this.clearCanvas();
        document.getElementById('selected-message').textContent = 'Click a node to see its message';
        document.getElementById('message-accuracy').textContent = '';
        document.getElementById('received-messages').innerHTML = '';
        document.getElementById('start-btn').style.display = '';
        document.getElementById('next-gen-btn').style.display = 'none';
        document.getElementById('next-gen-btn').disabled = false;
        document.getElementById('generation-count').textContent = 'Generations: 0';
        this.clearErrorTable();
        this.clearVariantTable();
    }

    startSimulation() {
        if (!this.validateKN()) return;
        this.nodesPerGeneration = parseInt(document.getElementById('nodes-per-generation').value);
        this.connectionsPerNode = parseInt(document.getElementById('connections').value);
        this.originalMessage = document.getElementById('message').value;

        this.reset();
        this.started = true;
        this.updateCanvasSize();

        // Create generation 0 (source node)
        const canvasWidth = this.canvas.width;
        const margin = 50;

        const node = {
            id: 0,
            generation: 0,
            x: canvasWidth / 2,
            y: margin,
            message: this.originalMessage,
            accuracy: 1.0,
            receivedMessages: []
        };
        this.nodes.push(node);

        this.drawNetwork();
        document.getElementById('start-btn').style.display = 'none';
        document.getElementById('next-gen-btn').style.display = '';
        this.updateErrorDistribution();
        this.updateVariantDistribution();
    }

    addGeneration() {
        if (!this.started || this.currentGeneration >= this.maxGenerations) return;
        if (!this.validateKN()) return;

        this.currentGeneration++;
        this.nodesPerGeneration = parseInt(document.getElementById('nodes-per-generation').value);
        this.connectionsPerNode = parseInt(document.getElementById('connections').value);

        const totalGenerations = this.currentGeneration + 1; // including gen 0
        this.updateCanvasSize();

        const canvasWidth = this.canvas.width;
        const canvasHeight = this.canvas.height;
        const margin = 50;

        // Reposition all existing nodes for new spacing
        for (const node of this.nodes) {
            const gen = node.generation;
            const nodesInGen = gen === 0 ? 1 : this.nodesPerGeneration;
            const nodesInGenForThisNode = this.nodes.filter(n => n.generation === gen);
            const indexInGen = nodesInGenForThisNode.indexOf(node);

            node.y = margin + (gen * (canvasHeight - 2 * margin)) / Math.max(1, totalGenerations - 1);
            if (nodesInGen === 1) {
                node.x = canvasWidth / 2;
            } else {
                node.x = margin + (indexInGen * (canvasWidth - 2 * margin)) / Math.max(1, nodesInGen - 1);
            }
        }

        // Add new generation nodes
        const newGen = this.currentGeneration;
        const nodesInNewGen = this.nodesPerGeneration;
        const y = margin + (newGen * (canvasHeight - 2 * margin)) / Math.max(1, totalGenerations - 1);

        for (let i = 0; i < nodesInNewGen; i++) {
            const x = nodesInNewGen === 1
                ? canvasWidth / 2
                : margin + (i * (canvasWidth - 2 * margin)) / Math.max(1, nodesInNewGen - 1);

            const node = {
                id: this.nodes.length,
                generation: newGen,
                x: x,
                y: y,
                message: '',
                accuracy: 0.0,
                receivedMessages: []
            };
            this.nodes.push(node);
        }

        // Generate connections from previous generation to new generation
        const prevGenNodes = this.nodes.filter(n => n.generation === newGen - 1);
        const newGenNodes = this.nodes.filter(n => n.generation === newGen);

        prevGenNodes.forEach(node => {
            if (node.generation === 0) {
                // Node 0 connects to ALL nodes in generation 1
                newGenNodes.forEach(targetNode => {
                    this.connections.push({ from: node, to: targetNode });
                });
            } else {
                const shuffled = [...newGenNodes].sort(() => 0.5 - Math.random());
                const targetCount = Math.min(this.connectionsPerNode, newGenNodes.length);
                for (let i = 0; i < targetCount; i++) {
                    this.connections.push({ from: node, to: shuffled[i] });
                }
            }
        });

        // Ensure every new node has at least one incoming connection
        newGenNodes.forEach(node => {
            const hasIncoming = this.connections.some(conn => conn.to === node);
            if (!hasIncoming) {
                const randomPrev = prevGenNodes[Math.floor(Math.random() * prevGenNodes.length)];
                this.connections.push({ from: randomPrev, to: node });
            }
        });

        // Simulate transmission for new generation only
        newGenNodes.forEach(node => {
            const incomingConnections = this.connections.filter(conn => conn.to === node);

            incomingConnections.forEach(conn => {
                let transmittedMessage;
                if (conn.from.generation === 0) {
                    transmittedMessage = conn.from.message;
                } else {
                    transmittedMessage = this.corruptMessage(conn.from.message);
                    this.transmissionVariants.add(transmittedMessage);
                }
                node.receivedMessages.push(transmittedMessage);
            });

            node.message = this.reconstructMessage(node.receivedMessages);
            node.accuracy = this.calculateAccuracy(node.message, this.originalMessage);
        });

        this.drawNetwork();
        document.getElementById('generation-count').textContent = `Generations: ${this.currentGeneration}`;
        this.updateErrorDistribution();
        this.updateVariantDistribution();

        if (this.currentGeneration >= this.maxGenerations) {
            document.getElementById('next-gen-btn').disabled = true;
        }
    }

    updateCanvasSize() {
        const margin = 50;

        // Width matches displayed container width
        const displayWidth = this.canvas.parentElement.clientWidth - 40; // account for padding
        this.canvas.width = Math.max(300, displayWidth);

        // Height grows with generations
        const totalGenerations = this.currentGeneration + 1;
        const genSpacing = 80;
        const dynamicHeight = Math.max(150, totalGenerations * genSpacing + 2 * margin);
        this.canvas.height = dynamicHeight;
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
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (event.clientX - rect.left) * scaleX;
        const y = (event.clientY - rect.top) * scaleY;

        this.selectNodeAtPosition(x, y);
    }

    handleCanvasTouch(event) {
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = event.changedTouches[0];
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        const x = (touch.clientX - rect.left) * scaleX;
        const y = (touch.clientY - rect.top) * scaleY;

        this.selectNodeAtPosition(x, y);
    }

    selectNodeAtPosition(x, y) {
        const clickedNode = this.nodes.find(node => {
            const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
            return distance <= 20;
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
            document.getElementById('faq-content').innerHTML = marked.parse(markdownText);
        } catch (error) {
            document.getElementById('faq-content').innerHTML = '<p>Error loading FAQ content.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TelephoneNetwork('network-canvas');
});
