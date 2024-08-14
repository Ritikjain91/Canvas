import React, { useState, useEffect } from 'react';
import { jsPlumb } from 'jsplumb';
import interact from 'interactjs';
import './Canvas.css';

const Canvas = () => {
    const [cards, setCards] = useState([]);
    const [jsPlumbInstance, setJsPlumbInstance] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalContent, setModalContent] = useState('');

    useEffect(() => {
        const instance = jsPlumb.getInstance({
            Connector: ['Flowchart', { stub: [30, 30], gap: 10 }],
            Endpoint: ['Dot', { radius: 5 }],
            EndpointStyle: { fill: '#456', outlineWidth: 1 },
            PaintStyle: { stroke: '#456', strokeWidth: 2 },
            HoverPaintStyle: { stroke: '#449999', strokeWidth: 4 },
            ConnectionOverlays: [
                ['Arrow', { width: 10, length: 10, location: 1 }],
            ],
            Container: 'canvas'
        });

        setJsPlumbInstance(instance);

        return () => {
            if (instance) {
                instance.reset();
            }
        };
    }, []);

    const addCard = () => {
        const newCard = {
            id: `card-${cards.length + 1}`,
            text: `This is some dummy text for card ${cards.length + 1}. Here you can add more details that can be shown in the modal.`,
            x: 100 + cards.length * 20,
            y: 100 + cards.length * 20,
        };
        setCards([...cards, newCard]);
    };

    useEffect(() => {
        if (jsPlumbInstance && cards.length > 0) {
            cards.forEach((card) => {
                const cardElement = document.getElementById(card.id);
                if (cardElement) {
                    jsPlumbInstance.draggable(cardElement, { grid: [20, 20] });

                   
                    jsPlumbInstance.addEndpoint(cardElement, {
                        anchors: ["Top", "Bottom", "Left", "Right"],
                        isSource: true,
                        isTarget: true,
                    });

                    interact(cardElement)
                        .draggable({
                            onmove: (event) => {
                                const target = event.target;
                                const x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
                                const y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

                                target.style.transform = `translate(${x}px, ${y}px)`;
                                target.setAttribute('data-x', x);
                                target.setAttribute('data-y', y);

                                jsPlumbInstance.revalidate(card.id); 
                            },
                        })
                        .resizable({
                            edges: { left: true, right: true, bottom: true, top: true },
                        })
                        .on('resizemove', (event) => {
                            const target = event.target;
                            let x = parseFloat(target.getAttribute('data-x')) || 0;
                            let y = parseFloat(target.getAttribute('data-y')) || 0;

                            target.style.width = event.rect.width + 'px';
                            target.style.height = event.rect.height + 'px';

                            x += event.deltaRect.left;
                            y += event.deltaRect.top;

                            target.style.transform = `translate(${x}px, ${y}px)`;

                            target.setAttribute('data-x', x);
                            target.setAttribute('data-y', y);

                            jsPlumbInstance.revalidate(card.id); 
                        });

                    if (isConnecting && selectedCard && selectedCard !== card.id) {
                        jsPlumbInstance.connect({
                            source: selectedCard,
                            target: card.id,
                            anchors: ["Bottom", "Top"],
                            connector: ["Flowchart", { stub: [40, 60], gap: 10 }],
                            endpoint: "Dot",
                            endpointStyle: { fill: "red", radius: 5 },
                        });
                        setSelectedCard(null);
                        setIsConnecting(false);
                    }
                }
            });
        }
    }, [jsPlumbInstance, cards, isConnecting, selectedCard]);

    const handleCardClick = (cardId) => {
        if (isConnecting) {
            setSelectedCard(cardId);
        }
    };

    const enableConnectionMode = () => {
        setIsConnecting(true);
    };

    const disableConnectionMode = () => {
        setIsConnecting(false);
        setSelectedCard(null);
    };

    const handleShowMore = (content) => {
        setModalContent(content);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleTextChange = (cardId, newText) => {
        setCards(cards.map(card => card.id === cardId ? { ...card, text: newText } : card));
    };

    return (
        <div>
            <div className="toolbar">
                <button
                    className={isConnecting ? "active" : ""}
                    onClick={isConnecting ? disableConnectionMode : enableConnectionMode}
                >
                    Arrow Tool
                </button>
                <button className="add-card" onClick={addCard}>
                    Add Card
                </button>
            </div>
            <div id="canvas" className="canvas">
                {cards.map((card) => (
                    <div
                        key={card.id}
                        id={card.id}
                        className="card"
                        style={{ transform: `translate(${card.x}px, ${card.y}px)` }}
                        onClick={() => handleCardClick(card.id)}
                    >
                        <textarea
                            value={card.text}
                            onChange={(e) => handleTextChange(card.id, e.target.value)}
                        />
                        <button onClick={() => handleShowMore(card.text)}>Show More</button>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={handleCloseModal}>&times;</span>
                        <p>{modalContent}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Canvas;
