import { Album, AlbumAttributes, AlbumCreationAttributes } from '../models/albums';

export class AlbumRepository {
    static async getAlbums(userId: number): Promise<Album[]> {
        return await Album.findAll( { where: { user_id: userId }});
    }

    static async addAlbum(data: AlbumCreationAttributes): Promise<Album> {
        data.created_at = data.updated_at = new Date();
        return await Album.create(data);
    }

    static async updateAlbum(albumData: AlbumAttributes): Promise<Album> {
        const album = await Album.findByPk(albumData.id);
        if (!album) {
            throw new Error('Album not found for given id');
        }
        albumData.updated_at = new Date();

        return await album.update(albumData);
    }

    static async deleteAlbum(albumId: number): Promise<number> {
        return await Album.destroy({ where: { id: albumId } });
    }
}
