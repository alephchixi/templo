uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uBrightness;
uniform float uSpeed;
uniform float uDistortion;
uniform vec2 uResolution;

uniform vec2 uMouse;
uniform float uInvert;
uniform float uHour;

varying vec2 vUv;

void main() {
    // Normalize coordinates to -1.0 to 1.0, correcting for aspect ratio
    vec2 st = vUv * 2.0 - 1.0;
    st.x *= uResolution.x / uResolution.y;

    // Normalize mouse similarly (uMouse is 0..1)
    vec2 mouseSt = uMouse * 2.0 - 1.0;
    mouseSt.x *= uResolution.x / uResolution.y;

    // Warping the Coordinate Space (Domain Warping)
    // Vector from pixel to mouse
    vec2 toMouse = st - mouseSt;
    float distToMouse = length(toMouse);
    
    // Create a broad, smooth falloff (Radius 4.0 covers most of screen)
    float warpInfluence = smoothstep(4.0, 0.0, distToMouse);
    
    // Restore "Zoom" (Displacement) but with controlled strength to keep it somewhat centered
    // Strength 0.8 ensures the center moves towards mouse but doesn't fly off screen
    st -= toMouse * warpInfluence * 0.8; 
    
    // Re-calculate distance from center using WARPED coordinates
    float d = length(st);

    // Removed "Flower" wave distortion to keep clean circles
    // float wave = sin(atan(st.y, st.x) * 12.0 + uTime * 2.0 + distToMouse * 5.0);
    // d += wave * warpInfluence * 0.15;
    
    // Create concentric rings using sine wave
    // Density affected by Distortion AND Hour
    // "Very few circles" -> Low density
    // Range: 3.0 (Minimal, ~1-2 rings) to 12.0 (Moderate)
    float baseDensity = 3.0 + uHour * 9.0; 
    float density = baseDensity + uDistortion * 5.0;
    
    // Ensure circular shape
    float rings = sin(d * density - uTime * uSpeed * 3.0);

    // Map rings (-1 to 1) to (0 to 1)
    float t = rings * 0.5 + 0.5;

    // Iridescent Color Mixing
     vec3 pearl = vec3(0.8, 0.8, 0.85); // Soft Grey/Blue-White (Reduced from 0.95 to avoid burnout)
    
    // Mix 1: Pearl to Color A
    vec3 c1 = mix(pearl, uColorA, t);
    // Mix 2: Color A to Color B based on distance/angle for iridescence
    float angle = atan(st.y, st.x);
    float irid = sin(angle * 2.0 + d * 5.0 + uTime); // Iridescence factor
    vec3 c2 = mix(uColorA, uColorB, irid * 0.5 + 0.5);
    
    // Final composite: predominantly the ring pattern `t`
    // Apply Radial Falloff to the rings to prioritize the center
    // We want the center to be strong, and outer rings to fade into the background quickly
    float centerFocus = smoothstep(1.2, 0.2, d); // 1.0 at center, 0.0 at edge
    
    // Mix the ring color with the background pearl color based on focus
    // This effectively "erases" the contrast of outer rings
    vec3 color = mix(pearl, mix(c1, c2, t), centerFocus * 0.8 + 0.2); // Maintain slight visibility at edges
    
    // ETHEREAL GLOW ADDITION
    // Boost glow at the center - REDUCED
    float centerGlowBoost = 1.0 + smoothstep(0.5, 0.0, d) * 1.2; // Reduced from 2.0 to 1.2
    float glow = pow(t, 4.0) * 0.3 * centerFocus * centerGlowBoost; // Reduced multiplier 0.5 -> 0.3
    color += vec3(glow); // Additive blending for glow

    // Strict Vignette to fully clear the edges if needed, or just let the focus handle it
    // Let's ensure the very edges are pearl
    color = mix(pearl, color, smoothstep(1.5, 0.5, d));
    
    // Apply brightness (but constrain it so it doesn't blow out to pure white)
    color *= uBrightness;

    // Apply Lowpass Inversion
    // Mix with inverted color based on uInvert (0 to 1)
    color = mix(color, 1.0 - color, uInvert);

    gl_FragColor = vec4(color, 1.0);
}
