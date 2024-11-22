import { WhereOptions } from 'sequelize';
import { Album, AlbumAttributes, AlbumCreationAttributes } from '../models/albums';

export class AlbumRepository {

    static async getAlbums(whereClause: WhereOptions<Album>): Promise<Album[]> {
        return await Album.findAll( { where: whereClause });
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

    static async updateAlbums(fields: any, whereClause: WhereOptions<Album>): Promise<void> {
        await Album.update(fields, { where: whereClause });
    }

    static async deleteAlbum(albumId: number): Promise<number> {
        return await Album.destroy({ where: { id: albumId } });
    }
}
