import { Tree } from "./tree"

export type UpdateTreeRequest = {
    tree: Tree
    new_image: {
        name: string,
        meta: {
            capturetimestamp: string,
            remark: string
        }
        data: string
    }
    delete_image: string
}