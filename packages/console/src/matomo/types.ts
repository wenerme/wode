/**
 * @see https://developer.matomo.org/guides/tracking-javascript-guide
 * @see https://github.com/matomo-org/matomo/blob/5.x-dev/js/piwik.js
 */
export interface MatomoTracker {
  // Log a page view
  trackPageView(title?: string): void;

  // Log an event with an event category (Videos, Music, Games...), an event action (Play, Pause, Duration, Add Playlist, Downloaded, Clicked...), and an optional event name and optional numeric value.
  trackEvent(category: string, action: string, name?: string, value?: number): void;

  // Log an internal site search for a specific keyword, in an optional category, specifying the optional count of search results in the page.
  trackSiteSearch(keyword: string, category?: string, count?: number): void;

  // Log a conversion for the numeric goal ID, with an optional numeric custom revenue customRevenue.
  trackGoal(idGoal: string | number, customRevenue?: number): void;

  // Log a click from your own code. url is the full URL which is to be tracked as a click. linkType can either be 'link' for an outlink or 'download' for a download.
  trackLink(url: string, linkType: string): void;

  // Scan the entire DOM for all content blocks and tracks all impressions once the DOM ready event has been triggered.
  trackAllContentImpressions(): void;

  // Scan the entire DOM for all content blocks as soon as the page is loaded. It tracks an impression only if a content block is actually visible.
  trackVisibleContentImpressions(checkOnScroll: number, timeIntervalInMs: number): void;

  // Scan the given DOM node and its children for content blocks and tracks an impression for them if no impression was already tracked for it.
  trackContentImpressionsWithinNode(domNode: any): void;

  // Track an interaction with the given DOM node / content block.
  trackContentInteractionNode(domNode: any, contentInteraction: any): void;

  // Track a content impression using the specified values.
  trackContentImpression(contentName: string, contentPiece: any, contentTarget: any): void;

  // Track a content interaction using the specified values.
  trackContentInteraction(contentInteraction: any, contentName: string, contentPiece: any, contentTarget: any): void;

  //  Log all found content blocks within a page to the console. This is useful to debug / test content tracking.
  logAllContentBlocksOnPage(): void;

  // Send a ping request. Ping requests do not track new actions. If they are sent within the standard visit length, they will update the existing visit time. If sent after the standard visit length, ping requests will be ignored. See also enableHeartBeatTimer
  ping(): void;

  enableHeartBeatTimer(activeTimeInSeconds: number): void;

  enableLinkTracking(enable?: boolean): void;

  enableFileTracking(): void;

  disablePerformanceTracking(): void;

  enableCrossDomainLinking(): void;

  setCrossDomainLinkingTimeout(timeout: number): void;

  getCrossDomainLinkingUrlParameter(): void;

  disableBrowserFeatureDetection(): void;

  enableBrowserFeatureDetection(): void;

  // setCookieDomain(domain: string): void;
  // trackEcommerceOrder(
  //   id: string,
  //   revenue: number,
  //   subTotal: number,
  //   tax: number,
  //   shipping: number,
  //   discount: number,
  // ): void;

  // readonly _paq: any[];
  // push(...args: any[]): void;

  // region Configuration

  setDocumentTitle(title: string): void;

  setDomains(domains: string[]): void;

  setCustomUrl(url: string): void;

  setReferrerUrl(url: string): void;

  setExcludedReferrers(excludedReferrers: string[] | string): void;

  setSiteId(id: string | number): void;

  setApiUrl(url: string): void;

  setTrackerUrl(url: string): void;

  getMatomoUrl(): string;

  getPiwikUrl(): string;

  getCurrentUrl(): string;

  setDownloadClasses(classes: string[] | string): void;

  setDownloadExtensions(extensions: string[] | string): void;

  addDownloadExtensions(extensions: string[] | string): void;

  removeDownloadExtensions(extensions: string[] | string): void;

  setIgnoreClasses(classes: string[] | string): void;

  setLinkClasses(classes: string[] | string): void;

  setLinkTrackingTimer(delay: number): void;

  getLinkTrackingTimer(): number;

  discardHashTag(enable: boolean): void;

  appendToTrackingUrl(url: string): void;

  setDoNotTrack(enable: boolean): void;

  // Enable a frame-buster to prevent the tracked web page from being framed/iframed.
  killFrame(): void;

  redirectFile(file: string): void;

  setHeartBeatTimer(minimumVisitLength: number, heartBeatDelay: number): void;

  getVisitorId(): string;

  setVisitorId(visitorId: string): void;

  getVisitorInfo(): string;

  getAttributionInfo(): string;

  getUserId(): string;

  setUserId(userId: string): void;

  resetUserId(): void;

  setPageViewId(pageViewId: string): void;

  getPageViewId(): string;

  setCustomVariable(index: number, name: string, value: string, scope?: string): void;

  deleteCustomVariable(index: number, scope?: string): void;

  getCustomVariable(index: number, scope?: string): string;

  storeCustomVariablesInCookie(): void;

  setCustomDimension(customDimensionId: string, value: string): void;

  deleteCustomDimension(customDimensionId: string): void;

  getCustomDimension(customDimensionId: string): string;

  setCampaignNameKey(campaignNameKey: string): void;

  setCampaignKeywordKey(campaignKeywordKey: string): void;

  setConversionAttributionFirstReferrer(enable: boolean): void;

  // endregion

  // region Ecommerce

  // endregion
}

declare global {
  interface Window {
    _paq: {
      push: (...args: any[]) => void;
    };
    Matomo: Matomo;
    Piwik: Matomo;
  }
}

interface MatomoAsyncTracker {}

interface Matomo {
  getTracker(trackerUrl?: string, siteId?: string): MatomoTracker;

  getAsyncTracker(optionalMatomoUrl?: string, optionalMatomoSiteId?: string): MatomoAsyncTracker;
}
