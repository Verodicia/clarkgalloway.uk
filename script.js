/**
 * Clark Galloway - Modern Website Scripts
 * Handles navigation, page transitions, and interactive features
 */

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all features
    initNavigation();
    initPageTransitions();
    initHeaderScroll();
    initSkillTree();
});

/**
 * Mobile Navigation Toggle
 */
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    if (!navToggle || !navLinks) return;

    navToggle.addEventListener('click', () => {
        const isOpen = navLinks.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close mobile nav when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        });
    });

    // Close mobile nav when clicking outside
    document.addEventListener('click', (e) => {
        if (!navToggle.contains(e.target) && !navLinks.contains(e.target)) {
            navLinks.classList.remove('open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
}

/**
 * Smooth Page Transitions
 */
function initPageTransitions() {
    // Fade in on page load
    document.body.classList.add('fade-in');
    setTimeout(() => {
        document.body.classList.remove('fade-in');
    }, 500);

    // Links now navigate directly without fade-out delay
}

/**
 * Header Scroll Effect
 * Adds 'scrolled' class when page is scrolled
 */
function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const handleScroll = () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Check initial state
}

/**
 * Skill Tree Initialization (for talent.html page)
 * Only runs if skill tree elements are present
 */
function initSkillTree() {
    const container = document.getElementById('skill-tree-container');
    const svg = document.getElementById('connections-svg');

    if (!container || !svg) return;

    // Store node positions and connections
    const nodes = [
        { id: 'node1', x: 24, y: 0, connections: ['node3', 'node4', 'node5'] },
        { id: 'node2', x: 72, y: 0, connections: ['node5', 'node6', 'node7'] },
        // row 2
        { id: 'node3', x: 12, y: 11, connections: ['node8', 'node9'] },
        { id: 'node4', x: 24, y: 11, connections: ['node9'] },
        { id: 'node5', x: 48, y: 11, connections: ['node9', 'node10', 'node11'] },
        { id: 'node6', x: 72, y: 11, connections: ['node11',] },
        { id: 'node7', x: 84, y: 11, connections: ['node11', 'node12'] },
        // row 3
        { id: 'node8', x: 12, y: 21.5, connections: ['node13'] },
        { id: 'node9', x: 24, y: 21.5, connections: ['node13', 'node14',] },
        { id: 'node10', x: 48, y: 21.5, connections: ['node14', 'node15', 'node16'] },
        { id: 'node11', x: 72, y: 21.5, connections: ['node16', 'node17', 'node'] },
        { id: 'node12', x: 84, y: 21.5, connections: ['node17', 'node', 'node'] },
        // row 4
        { id: 'node13', x: 12, y: 32, connections: ['node18', 'node19', 'node20'] },
        { id: 'node14', x: 36, y: 32, connections: ['node20', 'node26', 'node'] },
        { id: 'node15', x: 48, y: 32, connections: ['node21', 'node', 'node'] },
        { id: 'node16', x: 60, y: 32, connections: ['node27', 'node22', 'node', 'node'] },
        { id: 'node17', x: 84, y: 32, connections: ['node22', 'node23', 'node24'] },
        // row 5
        { id: 'node18', x: 0, y: 42.5, connections: ['node25', 'node', 'node'] },
        { id: 'node19', x: 12, y: 42.5, connections: ['node25', 'node', 'node'] },
        { id: 'node20', x: 24, y: 42.5, connections: ['node25', 'node29'] },
        { id: 'node21', x: 48, y: 42.5, connections: ['node31', 'node', 'node'] },
        { id: 'node22', x: 72, y: 42.5, connections: ['node33', 'node28', 'node'] },
        { id: 'node23', x: 84, y: 42.5, connections: ['node28', 'node', 'node'] },
        { id: 'node24', x: 96, y: 42.5, connections: ['node28', 'node', 'node'] },
        //row 6
        { id: 'node25', x: 12, y: 53, connections: ['node34', 'node29', 'node'] },
        { id: 'node26', x: 36, y: 53, connections: ['node29', 'node30', 'node31'] },
        { id: 'node27', x: 60, y: 53, connections: ['node31', 'node32', 'node33'] },
        { id: 'node28', x: 84, y: 53, connections: ['node33', 'node38', 'node'] },
        // row 7
        { id: 'node29', x: 24, y: 63.5, connections: ['node34', 'node35'] },
        { id: 'node30', x: 36, y: 63.5, connections: ['node35', 'node'] },
        { id: 'node31', x: 48, y: 63.5, connections: ['node35', 'node36', 'node37'] },
        { id: 'node32', x: 60, y: 63.5, connections: ['node37'] },
        { id: 'node33', x: 72, y: 63.5, connections: ['node37', 'node38'] },
        // row 8
        { id: 'node34', x: 12, y: 74, connections: ['node39'] },
        { id: 'node35', x: 36, y: 74, connections: ['node40'] },
        { id: 'node36', x: 48, y: 74, connections: ['node', 'node'] },
        { id: 'node37', x: 60, y: 74, connections: ['node41'] },
        { id: 'node38', x: 84, y: 74, connections: ['node42'] },
        //row 9
        { id: 'node39', x: 12, y: 84.5, connections: ['node43'] },
        { id: 'node40', x: 36, y: 84.5, connections: ['node44', 'node45', 'node'] },
        { id: 'node41', x: 60, y: 84.5, connections: ['node46', 'node47', 'node'] },
        { id: 'node42', x: 84, y: 84.5, connections: ['node48', 'node49'] },
        //row 10
        { id: 'node43', x: 12, y: 95, connections: ['node'] },
        { id: 'node44', x: 30, y: 95, connections: ['node'] },
        { id: 'node45', x: 42, y: 95, connections: ['node'] },
        { id: 'node46', x: 54, y: 95, connections: ['node', 'node'] },
        { id: 'node47', x: 66, y: 95, connections: ['node'] },
        { id: 'node48', x: 78, y: 95, connections: ['node'] },
        { id: 'node49', x: 90, y: 95, connections: ['node'] },
    ];

    // Track highlighted nodes
    const highlightedNodes = new Set();

    // Add a click counter for each node
    const nodeClickCounts = {};
    nodes.forEach(node => {
        nodeClickCounts[node.id] = 0;
    });

    function setInitialNodePositions() {
        const containerRect = container.getBoundingClientRect();
        const nodeWidth = 40;
        const nodeHeight = 40;

        nodes.forEach(nodeData => {
            let nodeElement = document.getElementById(nodeData.id);
            if (!nodeElement) return;

            // Node 1 and 2 are always visible
            let isVisible = (nodeData.id === 'node1' || nodeData.id === 'node2');

            // Otherwise, show if highlighted or connected to a highlighted node
            if (!isVisible) {
                if (highlightedNodes.has(nodeData.id)) {
                    isVisible = true;
                } else {
                    nodes.forEach(n => {
                        if (highlightedNodes.has(n.id) && n.connections.includes(nodeData.id)) {
                            isVisible = true;
                        }
                    });
                }
            }

            nodeElement.style.display = isVisible ? 'flex' : 'none';

            let newX = (nodeData.x / 100) * (containerRect.width - nodeWidth);
            let newY = (nodeData.y / 100) * (containerRect.height - nodeHeight);

            nodeElement.style.left = `${newX}px`;
            nodeElement.style.top = `${newY}px`;
        });
        drawConnections();
    }

    function drawConnections() {
        svg.innerHTML = '<defs></defs>';
        const containerRect = container.getBoundingClientRect();

        nodes.forEach(node => {
            const sourceElement = document.getElementById(node.id);
            if (!sourceElement || sourceElement.style.display === 'none') return;
            const sourceRect = sourceElement.getBoundingClientRect();
            const sourceX = sourceRect.left - containerRect.left + sourceRect.width / 2;
            const sourceY = sourceRect.top - containerRect.top + sourceRect.height / 2;

            node.connections.forEach(targetId => {
                const targetElement = document.getElementById(targetId);
                if (!targetElement || targetElement.style.display === 'none') return;
                const targetRect = targetElement.getBoundingClientRect();
                const targetX = targetRect.left - containerRect.left + targetRect.width / 2;
                const targetY = targetRect.top - containerRect.top + targetRect.height / 2;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', sourceX);
                line.setAttribute('y1', sourceY);
                line.setAttribute('x2', targetX);
                line.setAttribute('y2', targetY);
                line.setAttribute('class', highlightedNodes.has(node.id) ? 'connection-arrow highlighted' : 'connection-arrow');
                svg.appendChild(line);
            });
        });
    }

    function handleNodeClick(event) {
        const clickedNode = event.currentTarget;
        const nodeId = clickedNode.id;
        const counterElem = clickedNode.querySelector('.node-counter');

        if (!highlightedNodes.has(nodeId)) {
            clickedNode.classList.add('highlighted');
            highlightedNodes.add(nodeId);
            nodeClickCounts[nodeId] = 1;
            counterElem.textContent = nodeClickCounts[nodeId];
            counterElem.style.display = 'block';
            setInitialNodePositions();
            drawConnections();
        } else {
            if (nodeClickCounts[nodeId] < 5) {
                nodeClickCounts[nodeId]++;
                counterElem.textContent = nodeClickCounts[nodeId];
            }
        }

        // Add pop animation
        clickedNode.classList.add('pop');
        setTimeout(() => {
            clickedNode.classList.remove('pop');
        }, 300);
    }

    // Initial setup
    setInitialNodePositions();

    // Ensure every node has a counter span and attach click listeners
    nodes.forEach(nodeData => {
        const nodeElement = document.getElementById(nodeData.id);
        if (nodeElement) {
            const counterElem = document.createElement('span');
            counterElem.classList.add('node-counter');
            counterElem.style.display = 'none';
            nodeElement.appendChild(counterElem);

            nodeElement.addEventListener('click', handleNodeClick);
        }
    });

    // Set title attributes for nodes based on their title element
    nodes.forEach(nodeData => {
        const nodeElement = document.getElementById(nodeData.id);
        if (nodeElement) {
            const titleElem = nodeElement.querySelector('.node-title');
            if (titleElem && titleElem.textContent.trim()) {
                nodeElement.title = titleElem.textContent.trim();
            }
        }
    });

    window.addEventListener('scroll', drawConnections, { passive: true });
    window.addEventListener('resize', () => {
        setInitialNodePositions();
        drawConnections();
    }, { passive: true });
}