import { Dimensions } from 'react-native'

// Event photos are portrait 4:5 everywhere: the cropper, the detail hero,
// every card and thumbnail. Change it here, not per screen.
export const EVENT_IMAGE_ASPECT = 4 / 5 // width / height

/** Height of an event photo shown at `width`. */
export const eventImageHeight = (width: number) => Math.round(width / EVENT_IMAGE_ASPECT)

/** Event card width inside the home page's sideways carousels. */
export const EVENT_CARD_CAROUSEL_W = 172

/** Event cards sit two per row in vertical lists, this far apart. */
export const EVENT_GRID_GAP = 12

/** Width of one cell in the two-column event card grid, given the list's side padding. */
export function eventGridCellWidth(sidePadding = 16) {
  return Math.floor((Dimensions.get('window').width - sidePadding * 2 - EVENT_GRID_GAP) / 2)
}
