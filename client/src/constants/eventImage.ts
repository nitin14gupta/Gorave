// Event photos are portrait 4:5 everywhere: the cropper, the detail hero,
// every card and thumbnail. Change it here, not per screen.
export const EVENT_IMAGE_ASPECT = 4 / 5 // width / height

/** Height of an event photo shown at `width`. */
export const eventImageHeight = (width: number) => Math.round(width / EVENT_IMAGE_ASPECT)
