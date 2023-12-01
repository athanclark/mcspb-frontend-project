import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';

export function setupRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
};

export function setupCamera() {
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.z = 4;
    return camera;
};

export function setupScene() {
    const scene = new THREE.Scene();
    scene.add(new THREE.AmbientLight(0xcccccc));
    scene.background = new THREE.Color();
    scene.fog = new THREE.Fog( 0xffffff, 1, 700);
    return scene;
};

export function setupParticles(particlesMaterial) {
    const particlesGeometry = new THREE.BufferGeometry();
    let verticies = [];
    for (let i = 0; i < 10000; i++) {
        const x = Math.random() * 2000 - 1000;
        const y = Math.random() * 2000 - 1000;
        const z = Math.random() * 2000 - 1000;
        verticies.push(x, y, z);
    }
    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(verticies, 3));

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);

    return particles;
};

export function makeInitialAttrs(camera) {
    return {
        particlesGroup: {
            rotation: {
                z: 0
            }
        },
        particles: {
            rotation: {
                speed: {
                    x: 0,
                },
            },
            size: 0
        },
        particles2: {
            rotation: {
                speed: {
                    x: 0,
                },
            },
            size: 0
        },
        scene: {
            background: {
                r: 1,
                g: 1,
                b: 1
            }
        },
        stars: {
            opacity: 0
        },
        fog: {
            opacity: 0,
            rotation: {
                speed: {
                    y: 0
                }
            }
        },
        clouds: {
            opacity: 0,
            y: 1000,
            yScale: 0.2,
            rotation: {
                speed: {
                    y: 0
                }
            }
        },
        camera: {
            position: {
                x: camera.position.x,
                y: camera.position.y
            }
        }
    };
};

export function makeEffects(intendedAttrs) {
    let intermittentInterval = null;
    const clear = function clear() {
        clearInterval(intermittentInterval);
        intermittentInterval = null;
        intendedAttrs.particles.size = 0;
        intendedAttrs.particles.rotation.speed.x = 0;
        intendedAttrs.particles2.size = 0;
        intendedAttrs.particles2.rotation.speed.x = 0;
        intendedAttrs.clouds.opacity = 0;
        intendedAttrs.clouds.y = 1000;
        intendedAttrs.clouds.yScale = 0.2;
        intendedAttrs.fog.opacity = 0;
    };
    const partlyCloudy = function partlyCloudy() {
        intendedAttrs.clouds.opacity = 1;
        intendedAttrs.clouds.y = 750;
        intendedAttrs.clouds.yScale = 0.5;
    };
    const moderatelyCloudy = function moderatelyCloudy() {
        intendedAttrs.clouds.opacity = 1;
        intendedAttrs.clouds.y = 400;
        intendedAttrs.clouds.yScale = 0.2;
    };
    const cloudy = function cloudy() {
        intendedAttrs.clouds.opacity = 1;
        intendedAttrs.clouds.y = 300;
        intendedAttrs.clouds.yScale = 0.2;
    };
    const lightRain = function lightRain() {
        intendedAttrs.particles.size = 2;
        intendedAttrs.particles.rotation.speed.x = 0.3;
    };
    const lightSnow = function lightSnow() {
        intendedAttrs.particles.size = 2;
        intendedAttrs.particles.rotation.speed.x = 0.01;
    };
    return {
        precip: {
            clear,
            partlyCloudy: () => {
                clear();
                partlyCloudy();
            },
            moderatelyCloudy: () => {
                clear();
                moderatelyCloudy();
            },
            cloudy: () => {
                clear();
                cloudy();
            },
            humid: function humid() {
                clear();
                intendedAttrs.fog.opacity = 0.5;
            },
            lightRain: () => {
                clear();
                partlyCloudy();
                lightRain();
            },
            overcastShowers: function overcastShowers() {
                clear();
                cloudy();
                lightRain();
            },
            intermittentShowers: function intermittentShowers() {
                clear();
                moderatelyCloudy();
                let showerOrClear = false;
                intermittentInterval = setInterval(() => {
                    if (!showerOrClear) {
                        lightRain();
                    } else {
                        intendedAttrs.particles.size = 0;
                        intendedAttrs.particles.rotation.speed.x = 0;
                    }
                    showerOrClear = !showerOrClear;
                }, 8000);
            },
            rain: function rain() {
                clear();
                moderatelyCloudy();
                lightSnow();
                intendedAttrs.particles.rotation.speed.x = 0.6;
                intendedAttrs.particles2.size = 2;
                intendedAttrs.particles2.rotation.speed.x = 0.6;
            },
            lightSnow: () => {
                clear();
                partlyCloudy();
                lightSnow();
            },
            snow: function snow() {
                clear();
                moderatelyCloudy();
                lightSnow();
                intendedAttrs.particles.rotation.speed.x = 0.05;
                intendedAttrs.particles2.size = 2;
                intendedAttrs.particles2.rotation.speed.x = 0.05;
            },
            rainAndSnow: function rainAndSnow() {
                clear();
                moderatelyCloudy();
                lightRain();
                intendedAttrs.particles2.size = 2;
                intendedAttrs.particles2.rotation.speed.x = 0.05;
            }
        },
        wind: {
            calm: function calm() {
                intendedAttrs.particlesGroup.rotation.z = 0;
                intendedAttrs.fog.rotation.speed.y = 0;
                intendedAttrs.clouds.rotation.speed.y = 0;
            },
            light: function light() {
                intendedAttrs.particlesGroup.rotation.z = 0.1;
                intendedAttrs.fog.rotation.speed.y = -0.1;
                intendedAttrs.clouds.rotation.speed.y = -0.1;
            },
            moderate: function moderate() {
                intendedAttrs.particlesGroup.rotation.z = 0.2;
                intendedAttrs.fog.rotation.speed.y = -0.2;
                intendedAttrs.clouds.rotation.speed.y = -0.2;
            },
            fresh: function fresh() {
                intendedAttrs.particlesGroup.rotation.z = 0.4;
                intendedAttrs.fog.rotation.speed.y = -0.4;
                intendedAttrs.clouds.rotation.speed.y = -0.4;
            },
            strong: function strong() {
                intendedAttrs.particlesGroup.rotation.z = 0.6;
                intendedAttrs.fog.rotation.speed.y = -0.6;
                intendedAttrs.clouds.rotation.speed.y = -0.6;
            },
            gale: function gale() {
                intendedAttrs.particlesGroup.rotation.z = 0.8;
                intendedAttrs.fog.rotation.speed.y = -0.8;
                intendedAttrs.clouds.rotation.speed.y = -0.8;
            },
            storm: function storm() {
                intendedAttrs.particlesGroup.rotation.z = 1;
                intendedAttrs.fog.rotation.speed.y = -1;
                intendedAttrs.clouds.rotation.speed.y = -1;
            },
            hurricane: function hurricane() {
                intendedAttrs.particlesGroup.rotation.z = 1.5;
                intendedAttrs.fog.rotation.speed.y = -2;
                intendedAttrs.clouds.rotation.speed.y = -2;
            }
        }
    };
};

export function makeTimePassed(actualAttrs, intendedAttrs, alteredObjects) {
    // Runs every frame
    return function timePassed(diff) {
        // represents "one full rotation every 10 seconds"
        const ang_speed = Math.PI / (5 * 1000);

        const diffSec = diff / 1000;

        // Move camera with mouse
        alteredObjects.camera.position.x +=
            (intendedAttrs.camera.position.x - alteredObjects.camera.position.x) * diffSec;
        alteredObjects.camera.position.y +=
            (- intendedAttrs.camera.position.y - alteredObjects.camera.position.y) * diffSec;
        alteredObjects.camera.lookAt(0, 0, 0);

        // Change rotation speed of particles
        actualAttrs.particles.rotation.speed.x +=
            (intendedAttrs.particles.rotation.speed.x - actualAttrs.particles.rotation.speed.x)
            * diffSec;
        actualAttrs.particles2.rotation.speed.x +=
            (intendedAttrs.particles2.rotation.speed.x - actualAttrs.particles2.rotation.speed.x)
            * diffSec;

        // Change rotation of particles
        alteredObjects.particles.rotation.x += actualAttrs.particles.rotation.speed.x * diffSec;
        alteredObjects.particles2.rotation.x += actualAttrs.particles2.rotation.speed.x * diffSec;
        alteredObjects.particlesGroup.rotation.z +=
            (intendedAttrs.particlesGroup.rotation.z - alteredObjects.particlesGroup.rotation.z)
            * diffSec;

        // Change size of particles
        actualAttrs.particles.size +=
            (intendedAttrs.particles.size - actualAttrs.particles.size) * diffSec;
        alteredObjects.particlesMaterial.size +=
            (actualAttrs.particles.size - alteredObjects.particlesMaterial.size) * diffSec;
        actualAttrs.particles2.size +=
            (intendedAttrs.particles2.size - actualAttrs.particles2.size) * diffSec;
        alteredObjects.particles2Material.size +=
            (actualAttrs.particles2.size - alteredObjects.particles2Material.size) * diffSec;

        // Change stars opacity
        alteredObjects.starsMaterial.opacity +=
            (intendedAttrs.stars.opacity - alteredObjects.starsMaterial.opacity) * diffSec;

        // Change fog opacity
        alteredObjects.fogMaterial.opacity +=
            (intendedAttrs.fog.opacity - alteredObjects.fogMaterial.opacity) * diffSec;
        actualAttrs.fog.rotation.speed.y +=
            (intendedAttrs.fog.rotation.speed.y - actualAttrs.fog.rotation.speed.y)
            * diffSec;
        alteredObjects.fog.rotation.y += actualAttrs.fog.rotation.speed.y * diffSec;

        // Clouds
        alteredObjects.cloudsMaterial.opacity +=
            (intendedAttrs.clouds.opacity - alteredObjects.cloudsMaterial.opacity) * diffSec;
        alteredObjects.clouds.position.y +=
            (intendedAttrs.clouds.y - alteredObjects.clouds.position.y) * diffSec;
        alteredObjects.clouds.scale.y +=
            (intendedAttrs.clouds.yScale - alteredObjects.clouds.scale.y) * diffSec;
        actualAttrs.clouds.rotation.speed.y +=
            (intendedAttrs.clouds.rotation.speed.y - actualAttrs.clouds.rotation.speed.y)
            * diffSec;
        alteredObjects.clouds.rotation.y += actualAttrs.clouds.rotation.speed.y * diffSec;

        // Background
        // let oldHSL = {};
        // alteredObjects.scene.background.getHSL(oldHSL);
        // alteredObjects.scene.background = new THREE.Color().setHSL(
        //     oldHSL.h + (intendedAttrs.scene.background.hue - oldHSL.h) * diffSec,
        //     oldHSL.s + (intendedAttrs.scene.background.saturation - oldHSL.s) * diffSec,
        //     oldHSL.l + (intendedAttrs.scene.background.lightness - oldHSL.l) * diffSec
        // );
        alteredObjects.scene.background.r +=
            (intendedAttrs.scene.background.r - alteredObjects.scene.background.r) * diffSec;
        alteredObjects.scene.background.g +=
            (intendedAttrs.scene.background.g - alteredObjects.scene.background.g) * diffSec;
        alteredObjects.scene.background.b +=
            (intendedAttrs.scene.background.b - alteredObjects.scene.background.b) * diffSec;
    };
};

export function makeAnimate(renderer, timePassed, scene, camera) {
    // Animation loop
    let last_frame = null;
    return function animate(now) {
        requestAnimationFrame(animate);

        const diff = now - last_frame;

        if (diff) {
            if (diff < 0) {
                throw new Error('diff should never be negative!', diff);
            }

            timePassed(diff);
        }

        renderer.render(scene, camera);
        last_frame = now;
    };
};

export function initiateAnimation(animate, renderer, camera) {
    // Error if WebGL isn't available
    if ( WebGL.isWebGLAvailable() ) {
        console.log('starting animation');
        requestAnimationFrame(animate);
        document.body.prepend(renderer.domElement);
    } else {
        const warning = WebGL.getWebGLErrorMessage();
        document.body.appendChild(warning);
    }

    // Adjust the camera and renderer when the window resizes
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);
        // composer.setSize(window.innerWidth, window.innerHeight);
    });
};
