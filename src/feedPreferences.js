// Preference is validated before it is used or sent to Supabase.
export const FEED_SORT_KEY = 'lockernoise-feed-sort';
export const validFeedSort = value => ['hot','new','top'].includes(value);
export function savedFeedSort(){
 try {const value=localStorage.getItem(FEED_SORT_KEY);return validFeedSort(value)?value:'hot'}
 catch{return 'hot'}
}
