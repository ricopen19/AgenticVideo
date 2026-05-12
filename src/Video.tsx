import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, useVideoConfig } from 'remotion';

const Title = () => {
    return (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', fontSize: 100, color: 'black'}}>
            <h1>Title</h1>
        </AbsoluteFill>
    );
};

const Body = () => {
    return (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', fontSize: 80, color: 'black'}}>
            <p>Body Content</p>
        </AbsoluteFill>
    );
};

export const MyVideo = () => {
    const frame = useCurrentFrame();
    const { durationInFrames } = useVideoConfig();

    // Fade out logic: last 30 frames (1 sec)
    const opacity = interpolate(
        frame,
        [durationInFrames - 30, durationInFrames],
        [1, 0],
        { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
    );

    return (
        <AbsoluteFill style={{ backgroundColor: 'black' }}>
            <div style={{ opacity, flex: 1, display: 'flex', width: '100%', height: '100%' }}>
                 <Sequence from={0} durationInFrames={90}>
                     <Title />
                 </Sequence>
                 <Sequence from={90}>
                     <Body />
                 </Sequence>
            </div>
        </AbsoluteFill>
    );
};
