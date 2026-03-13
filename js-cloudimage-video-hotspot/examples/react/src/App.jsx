import { useRef } from 'react';
import { CIVideoHotspotViewer } from 'js-cloudimage-video-hotspot/react';

export default function App() {
  const viewerRef = useRef(null);

  return (
    <div style={{ maxWidth: 800, margin: '40px auto' }}>
      <h1>React Example</h1>
      <CIVideoHotspotViewer
        ref={viewerRef}
        src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
        trigger="click"
        pauseOnInteract
        hotspots={[
          {
            id: 'react-item',
            x: '50%',
            y: '50%',
            startTime: 5,
            endTime: 20,
            label: 'React Hotspot',
            data: {
              title: 'React Integration',
              description: 'This hotspot is rendered via the React component.',
              price: '$29.99',
            },
          },
        ]}
        onHotspotClick={(event, hotspot) => {
          console.log('Clicked:', hotspot.id);
        }}
      />
      <div style={{ marginTop: 16 }}>
        <button onClick={() => viewerRef.current?.play()}>Play</button>
        <button onClick={() => viewerRef.current?.pause()}>Pause</button>
        <button onClick={() => viewerRef.current?.nextHotspot()}>Next Hotspot</button>
      </div>
    </div>
  );
}
