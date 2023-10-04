/*
{
    "trees": [
        {
            "_id": "627728c703e68fa18e653ef0",
            "sapling_id": "26726",
            "image": [
                "https://14treesplants.s3.ap-south-1.amazonaws.com/trees/rn_image_picker_lib_temp_661a041a-f32e-4bd8-b107-e8fb556b6e99.jpg"
            ],
            "date_added": "2022-05-08T02:19:51.426Z",
            "tags": [],
            "location": {
                "type": "Point",
                "coordinates": [
                    18.93778008,
                    73.77248037
                ]
            },
            "date_assigned": "2022-07-04T06:24:25.171Z",
            "mapped_to": "62c287999fa68911b134b0a0",
            "desc": "Rotary Club of Nigdi Pune",
            "event_type": "",
            "link": "",
            "tree_type": {
                "_id": "61712df7ecca824c57c6853b",
                "name": "Charoli (चारोळी)",
                "scientific_name": "Buchanania cochinchinensis",
                "tree_id": "47",
                "image": [
                    "https://14treesplants.s3.ap-south-1.amazonaws.com/treetypes/charoli.jpeg"
                ],
                "tags": [],
                "__v": 0
            },
            "plot": {
                "_id": "617108038d6029b7f19f7632",
                "name": "(14T)-(वेताळे)-645(14T-F)",
                "plot_id": "645",
                "tags": [],
                "boundaries": {
                    "type": "Polygon",
                    "coordinates": [
                        [
                            [
                                18.93762658880714,
                                73.77323039493112
                            ],
                            [
                                18.93802484437587,
                                73.77327873204523
                            ],
                            [
                                18.93798775097672,
                                73.77247665188175
                            ],
                            [
                                18.93796544988841,
                                73.77188294007138
                            ],
                            [
                                18.93769780368562,
                                73.77190468663775
                            ],
                            [
                                18.93762658880714,
                                73.77323039493112
                            ]
                        ]
                    ]
                },
                "center": {
                    "type": "Point",
                    "coordinates": [
                        0,
                        0
                    ]
                },
                "__v": 0
            },
            "assignment": {
                "organization": {
                    "_id": "61726fe62793a0a9994b8bc2",
                    "name": "Individual",
                    "type": "Individual",
                    "desc": "Individual nature lovers",
                    "date_added": "2021-10-22T00:00:00.000Z",
                    "__v": 0
                },
                "donated_by_user": {
                    "_id": "62c287999fa68911b134b0a0",
                    "name": "Rotary Club of Nigdi- pune",
                    "userid": "rotaryclubofnigdipunercnp@14trees",
                    "phone": 1234567890,
                    "email": "RCNP@14trees",
                    "date_added": "2022-07-04T06:24:25.113Z",
                    "__v": 0
                }
            },
            "mapped_to_user": {
                "_id": "62c287999fa68911b134b0a0",
                "name": "Rotary Club of Nigdi- pune",
                "userid": "rotaryclubofnigdipunercnp@14trees",
                "phone": 1234567890,
                "email": "RCNP@14trees",
                "date_added": "2022-07-04T06:24:25.113Z",
                "__v": 0
            }
        }
    ],
    "user": {
        "_id": "62c2d39a9fa68911b134b1ce",
        "name": "Pravin Ghanegaonkar",
        "userid": "pravinghanegaonkarpmghanegaonkar@yahoo.com",
        "phone": 0,
        "email": "pmghanegaonkar@yahoo.com",
        "dob": "2022-07-04T00:00:00.000Z",
        "date_added": "2022-07-04T11:48:42.719Z",
        "__v": 0
    }
}
*/

export interface BaseUser {
    name: string,
    userid: string,
    phone: string,
    email: string,
    dob: string,
    date_added: string,
}

export interface DBUser extends BaseUser {
    _id: string,
}

export type Org = {
    _id: string,
    name: string,
    type: string,
    desc: string,
    date_added: string,
}

export type Plot = {
    _id: string,
    name: string,
    plot_id: string,
    tags: string[],
    boundaries: {
        type: string,
        coordinates: number[][],
    },
    center: {
        type: string,
        coordinates: number[],
    },
}

export type TreeType = {
    _id: string,
    name: string,
    scientific_name: string,
    tree_id: string,
    image: string[],
    tags: string[],
}

export type UserTree = {
    _id: string,
    sapling_id: string,
    image: string[],
    date_added: string,
    tags : string[],
    location: {
        type: string,
        coordinates: number[],
    },
    tree_type: TreeType,
    plot: Plot,
    assignment: {
        organization: Org,
        donated_by_user: DBUser,
    },
    mapped_to_user: DBUser,
}

export type ProfileUserInfo = {
    user_trees: ProfileUserTree[],
    _id: string,
    name: string,
    userid: string,
    date_added: string,
}

export type ProfileUserTree = {
    _id: string,
    user: string,
    tree?: string,
    orgid?: { name: string },
    donated_by?: { _id: string, name: string },
    profile_image?: string[],
    gifted_by?: String,
    planted_by?: String,
    memories?: string[],
    plantation_type?: String,
    date_added?: String,
}

export type SearchResult = {
    total_results: number,
    tree_type: string[],
    users: ProfileUserInfo[],
}