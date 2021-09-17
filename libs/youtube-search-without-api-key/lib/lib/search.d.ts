export declare function searchVideo(searchQuery: string): Promise<{
    id: {
        videoId: any;
    };
    url: string;
    title: string;
    description: any;
    duration_raw: any;
    snippet: {
        url: string;
        duration: any;
        publishedAt: any;
        thumbnails: {
            id: any;
            url: any;
            default: any;
            high: any;
            height: any;
            width: any;
        };
        title: string;
        views: any;
    };
    views: any;
}[]>;
