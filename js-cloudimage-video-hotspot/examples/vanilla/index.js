import CIVideoHotspot from 'js-cloudimage-video-hotspot';

const player = new CIVideoHotspot('#player', {
  src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  trigger: 'click',
  pauseOnInteract: true,
  hotspots: [
    {
      id: 'item-1',
      x: '40%',
      y: '50%',
      startTime: 5,
      endTime: 20,
      label: 'Featured Product',
      data: {
        title: 'Amazing Product',
        price: '$49.99',
        description: 'Click to learn more about this product.',
        url: '#',
        ctaText: 'View Details',
      },
    },
  ],
  onHotspotClick(event, hotspot) {
    console.log('Clicked:', hotspot.id);
  },
});

// Expose instance for debugging
window.player = player;
