import { describe, it, expect } from 'vitest';
import {
  getStyleDescription,
  getRoomLabel,
  getRoomFurniture,
  DEFAULT_STYLE_DESCRIPTION,
  DEFAULT_ROOM_LABEL,
  DEFAULT_ROOM_FURNITURE,
  STYLE_DESCRIPTIONS,
  ROOM_LABELS,
} from '@/src/shared/constants/interior-design';

describe('interior-design constants', () => {
  describe('getStyleDescription', () => {
    it('retourne la description canonique pour un style connu', () => {
      expect(getStyleDescription('japandi')).toBe(STYLE_DESCRIPTIONS.japandi);
    });

    it('normalise la casse', () => {
      expect(getStyleDescription('JAPANDI')).toBe(STYLE_DESCRIPTIONS.japandi);
    });

    it('retombe sur le défaut pour un style inconnu ou vide', () => {
      expect(getStyleDescription('inconnu')).toBe(DEFAULT_STYLE_DESCRIPTION);
      expect(getStyleDescription(undefined)).toBe(DEFAULT_STYLE_DESCRIPTION);
    });
  });

  describe('getRoomLabel', () => {
    it('mappe les slugs FR vers les libellés EN', () => {
      expect(getRoomLabel('salle-de-bain')).toBe(ROOM_LABELS['salle-de-bain']);
      expect(getRoomLabel('cuisine')).toBe('kitchen');
    });

    it('retombe sur le défaut pour une pièce inconnue', () => {
      expect(getRoomLabel('garage')).toBe(DEFAULT_ROOM_LABEL);
    });
  });

  describe('getRoomFurniture', () => {
    it('retourne le mobilier pour une pièce connue', () => {
      expect(getRoomFurniture('chambre')).toContain('bed');
    });

    it('retombe sur le défaut pour une pièce inconnue', () => {
      expect(getRoomFurniture('grenier')).toBe(DEFAULT_ROOM_FURNITURE);
    });
  });
});
