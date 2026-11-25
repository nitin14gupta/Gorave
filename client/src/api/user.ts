import ApiService from './apiService'
import { markMyProfileStale } from '@/lib/myProfileCache'
export type { UserResponse, PhotoResponse, CityResponse, ProfileResponse, InterestResponse } from './apiService'

// Your own profile is cached on the phone (lib/myProfileCache). Anything here
// that changes it marks that copy out of date once it succeeds, so the next
// time the profile shows it refetches in the background, whichever screen made
// the edit. Add any new "change my profile" call through `mine`.
function mine<T>(request: Promise<T>): Promise<T> {
  return request.then(result => {
    markMyProfileStale()
    return result
  })
}

export const createProfile = (data: { name: string; dob: string; gender: string; bio?: string }) =>
  mine(ApiService.createProfile(data))

export const updateProfile = (data: { name?: string; username?: string; dob?: string; gender?: string; bio?: string; badges?: string[] }) =>
  mine(ApiService.updateProfile(data))

export const setInterests = (interests: string[]) =>
  mine(ApiService.setInterests(interests))

export const setLocation = (city: string, lat?: number, lng?: number) =>
  mine(ApiService.setLocation(city, lat, lng))

export const getMe = () => ApiService.getMe()

export const uploadPhoto = (uri: string, position: number) =>
  mine(ApiService.uploadPhoto(uri, position))

export const deletePhoto = (id: string) => mine(ApiService.deletePhoto(id))

export const swapPhotos = (positionA: number, positionB: number) =>
  mine(ApiService.swapPhotos(positionA, positionB))

export const reorderPhotos = (updates: { id: string; position: number }[]) =>
  mine(ApiService.reorderPhotos(updates))

export const uploadVoice = (uri: string) => mine(ApiService.uploadVoice(uri))

export const getCities = () => ApiService.getCities()
export const getInterests = () => ApiService.getInterests()
export const getBadges = () => ApiService.getBadges()

export const getProfile = (userId: string) => ApiService.getProfile(userId)
export const followUser = (userId: string) => ApiService.followUser(userId)
export const unfollowUser = (userId: string) => ApiService.unfollowUser(userId)
