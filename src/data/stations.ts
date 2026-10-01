import type { Station } from '../types/station'

/**
 * Pickup and drop-off points transcribed from the supplied DOTr route poster.
 * Coordinates are intentionally omitted until each point is verified.
 */
export const stations: Station[] = [
  {
    id: 'monumento',
    name: 'Monumento',
    order: 1,
    direction: 'both',
  },
  {
    id: 'bagong-barrio',
    name: 'Bagong Barrio',
    order: 2,
    direction: 'both',
  },
  {
    id: 'balintawak',
    name: 'Balintawak',
    order: 3,
    direction: 'both',
  },
  {
    id: 'kaingin-road',
    name: 'Kaingin Road',
    order: 4,
    direction: 'both',
  },
  {
    id: 'roosevelt',
    name: 'LRT-1 Roosevelt Station',
    order: 5,
    direction: 'both',
  },
  {
    id: 'north-avenue',
    name: 'MRT-3 North Avenue Station',
    order: 6,
    direction: 'both',
  },
  {
    id: 'quezon-avenue',
    name: 'MRT-3 Quezon Avenue Station',
    order: 7,
    direction: 'both',
  },
  {
    id: 'nepa-q-mart',
    name: 'Nepa Q. Mart',
    order: 8,
    direction: 'both',
  },
  {
    id: 'main-avenue-cubao',
    name: 'Main Avenue, Cubao',
    order: 9,
    direction: 'both',
  },
  {
    id: 'santolan',
    name: 'MRT-3 Santolan Station',
    order: 10,
    direction: 'both',
  },
  {
    id: 'ortigas',
    name: 'MRT-3 Ortigas Station',
    order: 11,
    direction: 'both',
  },
  {
    id: 'guadalupe-bridge',
    name: 'Guadalupe Bridge',
    order: 12,
    direction: 'both',
  },
  {
    id: 'buendia',
    name: 'MRT-3 Buendia Station',
    order: 13,
    direction: 'both',
  },
  {
    id: 'ayala-avenue',
    name: 'Ayala Avenue Bus Stop',
    order: 14,
    direction: 'both',
  },
  {
    id: 'taft-avenue',
    name: 'Taft Avenue (curbside)',
    order: 15,
    direction: 'both',
  },
  {
    id: 'sm-mall-of-asia',
    name: 'SM Mall of Asia (MOA)',
    order: 16,
    direction: 'both',
  },
  {
    id: 'pitx',
    name: 'PITX Terminal',
    order: 17,
    direction: 'both',
  },
]
