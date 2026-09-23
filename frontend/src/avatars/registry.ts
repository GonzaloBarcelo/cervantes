import type { AvatarModule } from '../contracts';
import { Portrait2D } from './portrait2d';
export const avatars: Record<string, () => AvatarModule> = { portrait2d: () => new Portrait2D() };
import { Bust3D } from './bust3d';
avatars.bust3d = () => new Bust3D();
