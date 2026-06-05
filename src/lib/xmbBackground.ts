let canvas: HTMLCanvasElement | null = null;
let gl: WebGLRenderingContext | null = null;
let animationFrameId: number | null = null;
let shaderProgram: WebGLProgram | null = null;
let timeUniformLocation: WebGLUniformLocation | null = null;
let resolutionUniformLocation: WebGLUniformLocation | null = null;

const vertexShaderSource = `
attribute vec2 aVertexPosition;
void main() {
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
}
`;

const fragmentShaderSource = `
precision highp float;

uniform float uTime;
uniform vec2  uResolution;

const float waveWidthFactor = 1.5;

vec3 calcSine(
	vec2 uv,
	float speed,
	float frequency,
	float amplitude,
	float phaseShift,
	float verticalOffset,
	vec3 baseColor,
	float lineWidth,
	float sharpness,
	bool invertFalloff
) {
	float angle = uTime * speed * frequency * -1.0 + (phaseShift + uv.x) * 2.0;
	float waveY = sin(angle) * amplitude + verticalOffset;
	float deltaY = waveY - uv.y;
	float distanceVal  = distance(waveY, uv.y);
	if (invertFalloff) {
		if (deltaY > 0.0) distanceVal *= 4.0;
	} else {
		if (deltaY < 0.0) distanceVal *= 4.0;
	}
	float smoothVal = smoothstep(lineWidth * waveWidthFactor, 0.0, distanceVal);
	float scaleVal  = pow(smoothVal, sharpness);
	return min(baseColor * scaleVal, baseColor);
}

void main() {
	vec2 uv = gl_FragCoord.xy / uResolution;
	vec3 accumulatedColor = vec3(0.0);
	accumulatedColor += calcSine(uv, 0.2, 0.20, 0.2, 0.0, 0.5, vec3(0.3), 0.1, 15.0, false);
	accumulatedColor += calcSine(uv, 0.4, 0.40, 0.15, 0.0, 0.5, vec3(0.3), 0.1, 17.0, false);
	accumulatedColor += calcSine(uv, 0.3, 0.60, 0.15, 0.0, 0.5, vec3(0.3), 0.05, 23.0, false);
	accumulatedColor += calcSine(uv, 0.1, 0.26, 0.07, 0.0, 0.3, vec3(0.3), 0.1, 17.0, true);
	accumulatedColor += calcSine(uv, 0.3, 0.36, 0.07, 0.0, 0.3, vec3(0.3), 0.1, 17.0, true);
	accumulatedColor += calcSine(uv, 0.5, 0.46, 0.07, 0.0, 0.3, vec3(0.3), 0.05, 23.0, true);
	accumulatedColor += calcSine(uv, 0.2, 0.58, 0.05, 0.0, 0.3, vec3(0.3), 0.2, 15.0, true);

	float maxChannel = accumulatedColor.r;
	if (accumulatedColor.g > maxChannel) maxChannel = accumulatedColor.g;
	if (accumulatedColor.b > maxChannel) maxChannel = accumulatedColor.b;
	if (maxChannel <= 0.0) discard;

	// Use white color for the waves, with alpha from the accumulated intensity
	gl_FragColor = vec4(vec3(1.0), maxChannel * 1.5);
}
`;

function compileShader(
  gl: WebGLRenderingContext,
  source: string,
  type: number,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initWebGL(gl: WebGLRenderingContext) {
  const vs = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
  const fs = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
  if (!vs || !fs) return false;

  const program = gl.createProgram();
  if (!program) return false;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Link error:", gl.getProgramInfoLog(program));
    return false;
  }
  gl.useProgram(program);
  shaderProgram = program;

  const posLoc = gl.getAttribLocation(program, "aVertexPosition");
  timeUniformLocation = gl.getUniformLocation(program, "uTime");
  resolutionUniformLocation = gl.getUniformLocation(program, "uResolution");

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const verts = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  // Enable blending for transparency
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  return true;
}

function resizeCanvas() {
  if (!canvas || !gl) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  gl.viewport(0, 0, canvas.width, canvas.height);
}

function renderFrame(timeMs: number) {
  if (
    !gl ||
    !shaderProgram ||
    !timeUniformLocation ||
    !resolutionUniformLocation
  )
    return;

  gl.clearColor(0.0, 0.0, 0.0, 0.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const timeSec = timeMs * 0.001;
  gl.uniform1f(timeUniformLocation, timeSec);
  gl.uniform2f(resolutionUniformLocation, canvas!.width, canvas!.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

  animationFrameId = requestAnimationFrame(renderFrame);
}

export function createXmbBackground(): () => void {
  // Create canvas
  canvas = document.createElement("canvas");
  canvas.id = "xmb-canvas";
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.zIndex = "-1";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  gl = canvas.getContext("webgl", { alpha: true });
  if (!gl) {
    console.error("WebGL not supported");
    return () => {};
  }

  if (!initWebGL(gl)) {
    return () => {};
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  animationFrameId = requestAnimationFrame(renderFrame);

  // Return cleanup function
  return () => {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    window.removeEventListener("resize", resizeCanvas);
    if (canvas) {
      document.body.removeChild(canvas);
      canvas = null;
    }
    gl = null;
  };
}
