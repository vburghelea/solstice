/**
 * Type definitions for teams database fields
 */

export interface TeamSocialLinks {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  discord?: string;
  youtube?: string;
  [key: string]: string | undefined;
}
