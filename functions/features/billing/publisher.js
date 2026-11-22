import { google } from 'googleapis'

let publisherPromise = null

async function getAndroidPublisher() {
  publisherPromise ||= createAndroidPublisher()
  return publisherPromise
}

async function createAndroidPublisher() {
  const auth = new google.auth.GoogleAuth({
    scopes: ['https://www.googleapis.com/auth/androidpublisher'],
  })
  return google.androidpublisher({ version: 'v3', auth: await auth.getClient() })
}

export { getAndroidPublisher }
