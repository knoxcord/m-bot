
interface SuccessResult<T> {
    success: true
    data: T;
}

interface ErrorResult {
    success: false,
    errorMessage: string
}

export type Result<T> = SuccessResult<T> | ErrorResult;

export const getErrorResult = (errorMessage: string): ErrorResult => ({
    success: false,
    errorMessage: errorMessage
})

export const getSuccessResult = <T>(data: T): SuccessResult<T> => ({
    success: true,
    data: data
})
