import { IWSMockSetting } from './type'
import { isUrlMatched } from './utils'

export let mockSocketUrls: string[][] = []
export let mockSocketSettings: IWSMockSetting[][] = []

export const storeMock = (settings: IWSMockSetting) => {
  let existIndex = -1
  if (
    mockSocketUrls.some((url, index) => {
      if (isUrlMatched(url[0], settings.url)) {
        existIndex = index
        return true
      }
      return false
    })
  ) {
    mockSocketSettings[existIndex].push(settings)
  } else {
    mockSocketUrls.push([settings.url])
    mockSocketSettings.push([settings])
  }
}
