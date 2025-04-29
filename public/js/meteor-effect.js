// Caractères utilisés pour le rendu
const CHARS = '.·+o*BOX@';
const GRID_SIZE = 12; // Taille d'une cellule en pixels

class OrbitalBackground {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.opacity = '0.6';
        this.canvas.style.backgroundColor = '#000';
        document.body.appendChild(this.canvas);
        
        this.ctx = this.canvas.getContext('2d');
        this.orbits = [];
        this.resize();
        
        this.createOrbits();
        
        window.addEventListener('resize', () => {
            this.resize();
            this.createOrbits();
        });
        this.animate();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.centerX = this.canvas.width / 2;
        this.centerY = this.canvas.height / 2;
        this.maxDimension = Math.max(this.canvas.width, this.canvas.height) * 1.2; // Réduit de 2 à 1.2
    }
    
    createOrbits() {
        this.orbits = [];
        const minRadius = this.maxDimension * 0.15; // Réduit de 0.2 à 0.15
        const maxRadius = this.maxDimension * 0.6; // Réduit de 0.8 à 0.6
        
        for (let i = 0; i < 10; i++) { // Réduit de 12 à 10 orbites
            const radius = minRadius + (maxRadius - minRadius) * (i / 9);
            const orbit = {
                radius,
                angle: Math.random() * Math.PI * 2,
                speed: (0.0001 + Math.random() * 0.0002) * (Math.random() < 0.5 ? 1 : -1),
                eccentricity: 0.15 + Math.random() * 0.4, // Réduit légèrement l'ellipticité
                rotation: Math.random() * Math.PI * 2,
                color: `rgba(${Math.random() < 0.5 ? '73, 218, 255' : '255, 255, 255'}, 0.4)`,
                dashOffset: 0,
                dashArray: [2 + Math.random() * 6, 8 + Math.random() * 16] // Légèrement réduit les espacements
            };
            this.orbits.push(orbit);
        }
    }
    
    drawOrbit(orbit) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = orbit.color;
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash(orbit.dashArray);
        this.ctx.lineDashOffset = orbit.dashOffset;
        
        const steps = 200;
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * Math.PI * 2;
            const r = orbit.radius * (1 - orbit.eccentricity * orbit.eccentricity) / 
                     (1 + orbit.eccentricity * Math.cos(angle));
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            
            const rotatedX = x * Math.cos(orbit.rotation) - y * Math.sin(orbit.rotation);
            const rotatedY = x * Math.sin(orbit.rotation) + y * Math.cos(orbit.rotation);
            
            if (i === 0) {
                this.ctx.moveTo(this.centerX + rotatedX, this.centerY + rotatedY);
            } else {
                this.ctx.lineTo(this.centerX + rotatedX, this.centerY + rotatedY);
            }
        }
        
        this.ctx.stroke();
        
        orbit.dashOffset += orbit.speed;
        orbit.angle += orbit.speed;
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        this.ctx.arc(this.centerX, this.centerY, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.orbits.forEach(orbit => this.drawOrbit(orbit));
        
        requestAnimationFrame(() => this.animate());
    }
}

// Initialiser l'effet
document.addEventListener('DOMContentLoaded', () => {
    new OrbitalBackground();
}); 