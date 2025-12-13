'use client';

import React from 'react';
import MoodboardPanel from './moodboard-panel';

export default function MoodboardPanel3(props: any) {
  return (
    <MoodboardPanel
      label="Moodboard3"
      storageKey="moodboard3-images"
      panelOffset={280}
      {...props}
    />
  );
}

