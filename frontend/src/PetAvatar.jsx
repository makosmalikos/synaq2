import React from 'react';

export const PET_AVATARS = [
  { id: 'owl', emoji: '🦉', ru: 'Совёнок', kk: 'Үкі' },
  { id: 'fox', emoji: '🦊', ru: 'Лисёнок', kk: 'Түлкі' },
  { id: 'panda', emoji: '🐼', ru: 'Панда', kk: 'Панда' },
  { id: 'lion', emoji: '🦁', ru: 'Львёнок', kk: 'Арыстан' },
  { id: 'penguin', emoji: '🐧', ru: 'Пингвин', kk: 'Пингвин' },
  { id: 'koala', emoji: '🐨', ru: 'Коала', kk: 'Коала' },
];

export const DEFAULT_PET_AVATAR = 'owl';

export function petAvatar(id) {
  return PET_AVATARS.find((pet) => pet.id === id) || PET_AVATARS[0];
}

export default function PetAvatar({ id, size = 'normal', label = '' }) {
  const pet = petAvatar(id);
  return (
    <span className={`pet-avatar pet-avatar--${pet.id} pet-avatar--${size}`} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
      <span>{pet.emoji}</span>
    </span>
  );
}
