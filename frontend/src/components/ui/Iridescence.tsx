import { Renderer, Program, Mesh, Color, Triangle } from "ogl";
import { useEffect, useRef } from "react";

import "./Iridescence.css";

const vertexShader = `
attribute vec2 uv;
attribute vec2 position;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
`;

const fragmentShader = `
precision highp float;

uniform float uTime;
uniform vec3 uColor;
uniform vec3 uResolution;
uniform vec2 uMouse;
uniform float uAmplitude;
uniform float uSpeed;

varying vec2 vUv;

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv.xy * 2.0 - 1.0) * uResolution.xy / mr;
  
  uv += (uMouse - vec2(0.5)) * uAmplitude;
  
  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (float i = 0.0; i < 8.0; ++i) {
    a += cos(i - d - a * uv.x);
    d += sin(uv.y * i + a);
  }
  d += uTime * 0.5 * uSpeed;
  
  // Create more vibrant patterns with depth
  vec3 col = vec3(cos(uv * vec2(d, a)) * 0.4 + 0.3, cos(a + d) * 0.4 + 0.3);
  col = cos(col * cos(vec3(d, a, 2.5)) * 0.4 + 0.3) * uColor;
  
  // Add blue/purple accents for depth
  float highlight1 = pow(max(0.0, sin(d * 0.5 + a * 0.3)), 5.0) * 0.25;
  col += vec3(highlight1 * 0.2, highlight1 * 0.3, highlight1 * 0.7);
  
  // Add subtle orange/amber highlights
  float highlight2 = pow(max(0.0, cos(d * 0.7 - a * 0.5)), 6.0) * 0.2;
  col += vec3(highlight2 * 0.9, highlight2 * 0.5, highlight2 * 0.1);
  
  // Add subtle glow effect
  float glow = pow(max(0.0, sin(d * 0.3 + a * 0.7)), 8.0) * 0.15;
  col += vec3(glow * 0.5, glow * 0.7, glow * 0.9);
  
  gl_FragColor = vec4(col, 1.0);
}
`;

interface IridescenceProps {
    color?: [number, number, number];
    speed?: number;
    amplitude?: number;
    mouseReact?: boolean;
}

export default function Iridescence({
    color = [1, 1, 1],
    speed = 1.0,
    amplitude = 0.1,
    mouseReact = true,
    ...rest
}: IridescenceProps) {
    const ctnDom = useRef<HTMLDivElement>(null);
    const mousePos = useRef({ x: 0.5, y: 0.5 });

    useEffect(() => {
        if (!ctnDom.current) return;
        const ctn = ctnDom.current;
        const renderer = new Renderer();
        const gl = renderer.gl;
        gl.clearColor(0, 0, 0, 0); // Transparent background to show through

        let program: Program;

        function resize() {
            const scale = 1;
            renderer.setSize(ctn.offsetWidth * scale, ctn.offsetHeight * scale);
            if (program) {
                program.uniforms.uResolution.value = new Color(
                    gl.canvas.width,
                    gl.canvas.height,
                    gl.canvas.width / gl.canvas.height
                );
            }
        }
        window.addEventListener("resize", resize, false);
        resize();

        const geometry = new Triangle(gl);
        program = new Program(gl, {
            vertex: vertexShader,
            fragment: fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uColor: { value: new Color(...color) },
                uResolution: {
                    value: new Color(
                        gl.canvas.width,
                        gl.canvas.height,
                        gl.canvas.width / gl.canvas.height
                    ),
                },
                uMouse: { value: new Float32Array([mousePos.current.x, mousePos.current.y]) },
                uAmplitude: { value: amplitude },
                uSpeed: { value: speed },
            },
        });

        const mesh = new Mesh(gl, { geometry, program });
        let animateId: number;

        function update(t: number) {
            animateId = requestAnimationFrame(update);
            program.uniforms.uTime.value = t * 0.001;
            renderer.render({ scene: mesh });
        }
        animateId = requestAnimationFrame(update);
        ctn.appendChild(gl.canvas);

        function handleMouseMove(e: MouseEvent) {
            const rect = ctn.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = 1.0 - (e.clientY - rect.top) / rect.height;
            mousePos.current = { x, y };
            program.uniforms.uMouse.value[0] = x;
            program.uniforms.uMouse.value[1] = y;
        }
        if (mouseReact) {
            ctn.addEventListener("mousemove", handleMouseMove);
        }

        return () => {
            cancelAnimationFrame(animateId);
            window.removeEventListener("resize", resize);
            if (mouseReact) {
                ctn.removeEventListener("mousemove", handleMouseMove);
            }
            ctn.removeChild(gl.canvas);
            gl.getExtension("WEBGL_lose_context")?.loseContext();
        };
    }, [color, speed, amplitude, mouseReact]);

    return (
        <div
            ref={ctnDom}
            className="iridescence-container"
            {...rest}
        />
    );
}