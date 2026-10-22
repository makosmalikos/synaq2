import React from 'react';
import './PetAvatar.css';

export const PET_AVATARS = [
  { id: 'owl', emoji: '🦉', ru: 'Совёнок', kk: 'Үкі' },
  { id: 'fox', emoji: '🦊', ru: 'Лисёнок', kk: 'Түлкі' },
  { id: 'panda', emoji: '🐼', ru: 'Панда', kk: 'Панда' },
  { id: 'lion', emoji: '🦁', ru: 'Львёнок', kk: 'Арыстан' },
  { id: 'penguin', emoji: '🐧', ru: 'Пингвин', kk: 'Пингвин' },
  { id: 'koala', emoji: '🐨', ru: 'Коала', kk: 'Коала' },
].map((pet) => ({ ...pet, image: `/mascot/synaq-${pet.id}-study.webp`, avatarImage: `/mascot/synaq-${pet.id}-avatar.webp` }));

export const DEFAULT_PET_AVATAR = 'owl';

export function petAvatar(id) {
  return PET_AVATARS.find((pet) => pet.id === id) || PET_AVATARS[0];
}

export default function PetAvatar({ id, size = 'normal', label = '', appearance = 'badge' }) {
  const pet = petAvatar(id);
  return (
    <span className={`pet-avatar pet-avatar--${pet.id} pet-avatar--${size} pet-avatar--${appearance}`} role={label ? 'img' : undefined} aria-label={label || undefined} aria-hidden={label ? undefined : 'true'}>
      <img src={pet.avatarImage} width="128" height="128" alt="" loading="lazy" decoding="async" draggable="false" />
    </span>
  );
}
