export declare const procSentData: (data: any) => {
    dataToBeSent: any;
    dataSize: number;
};
export declare const isValidUrl: (url: string) => string | boolean;
export declare const isUrlMatched: (url1: string | RegExp, url2: string | RegExp) => boolean;
export declare const getCurrent: () => number;
