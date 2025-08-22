export interface ScanUploadResults{
    subject:string,
    from:string,
    fileName:string,
    fileId:string
}


export interface ScanUploads{
    message:string,
    uploadCounts:number,
    uploads:ScanUploadResults[],
}