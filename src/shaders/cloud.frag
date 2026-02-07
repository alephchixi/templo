uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uBrightness;
uniform float uSeed; // New random seed

uniform float uSpeed;
uniform float uDistortion;

uniform float uCloudTime;
varying vec2 vUv;

// Utility functions
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

// Grain noise
float grain(vec2 st, float time) {
    return random(st + mod(time, 10.0)); // Animating grain
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 st) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.50));
    for (int i = 0; i < 6; ++i) { // Increased iterations for more detail/softness
        v += a * noise(st);
        st = rot * st * 2.0 + shift;
        a *= 0.5;
    }
    return v;
}

// Iridescence mixing
vec3 iridescence(float v) {
    // Multi-stop gradient simulating thin-film interference
    // Similar to the user's reference: Pearlescent white -> Pink -> Gold -> Blue
    vec3 col1 = vec3(0.9, 0.9, 1.0); // Pearl
    vec3 col2 = vec3(1.0, 0.4, 0.8); // Pink/Magenta
    vec3 col3 = vec3(1.0, 0.8, 0.4); // Gold
    vec3 col4 = vec3(0.4, 0.6, 1.0); // Soft Blue

    vec3 c = mix(col1, col2, smoothstep(0.0, 0.33, v));
    c = mix(c, col3, smoothstep(0.33, 0.66, v));
    c = mix(c, col4, smoothstep(0.66, 1.0, v));
    return c;
}

void main() {
    vec2 st = vUv * 2.5; // Scale
    
    // Smooth time from JS integration
    float time = uCloudTime; 

    // Use seed to offset noise space -> Unique texture per load
    st += vec2(uSeed * 100.0); 

    // Distortion fields
    vec2 q = vec2(0.);
    q.x = fbm( st + 0.00*time );
    q.y = fbm( st + vec2(1.0));
    
    // Apply Distortion Uniform to 'r' calculation
    vec2 distortOffset = vec2(uDistortion * 2.0 * sin(time * 0.5));

    vec2 r = vec2(0.);
    r.x = fbm( st + 1.0*q + vec2(1.7,9.2)+ 0.15*time + distortOffset ); // Warp X
    r.y = fbm( st + 1.0*q + vec2(8.3,2.8)+ 0.126*time - distortOffset ); // Warp Y

    float f = fbm(st+r);

    // Color mixing
    vec3 iridescentColor = iridescence(f);
    
    // Mix uColorA/B (Time of Day) with Iridescence
    vec3 baseColor = mix(uColorA, uColorB, f);
    
    // Blend approach: Soft Light or Screen
    vec3 finalColor = mix(baseColor, iridescentColor, 0.5); // 50% blend

    // Dynamic Color Shift based on Distortion
    // High distortion introduces weird hues (e.g. green/purple glitches)
    if (uDistortion > 0.5) {
         finalColor = mix(finalColor, 1.0 - finalColor, (uDistortion - 0.5) * 0.5); // Color inversion / negative effect
    }

    // Apply brightness (Battery interaction)
    finalColor *= uBrightness;

    // Apply Film Grain
    float g = grain(vUv, uTime * 2.0);
    // Submit noise to color (subtle)
    finalColor += (g - 0.5) * 0.08; // 8% grain strength

    gl_FragColor = vec4(finalColor, 1.0);
}
