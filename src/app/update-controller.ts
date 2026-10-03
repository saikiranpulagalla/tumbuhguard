export interface UpdateController {
  readonly updateAvailable: boolean;
  apply(): Promise<void>;
}

export function passiveUpdateController(): UpdateController {
  return { updateAvailable: false, async apply() { location.reload(); } };
}
