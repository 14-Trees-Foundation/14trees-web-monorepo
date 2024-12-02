import { Request, Response } from "express";
import { UserRepository } from "../repo/userRepo";
import { status } from "../helpers/status";
import { UploadFileToS3 } from "./helper/uploadtos3";
import { AlbumCreationAttributes } from "../models/albums";
import { AlbumRepository } from "../repo/albumRepo";


export const createAlbum = async (req: Request, res: Response) => {
  let email = req.params["email"];
  try {
    if (req.body.album_name === undefined || req.body.album_name === '') {
      res.status(status.bad).send({ message: "Album name required!." });
      return;
    }

    let resp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', value: email, operatorValue: 'equals' }]);
    if (resp === null || resp.results.length === 0) {
      res
        .status(status.notfound)
        .send({ message: "User not registered! Contact Admin." });
      return;
    }
    const user = resp.results[0];

    let date = new Date().toISOString().slice(0, 10);
    let album_name =
      user.name.split(" ")[0] + "/" + date + "/" + req.body.album_name;

    let memoryImageUrls = [];
    if (req.body.file_names !== undefined) {
      if (req.body.file_names.length > 0) {
        let imagesAll = req.body.file_names.split(',')
        for (const image of imagesAll) {
          const location = await UploadFileToS3(image, "albums", album_name);
          if (location !== "") {
            memoryImageUrls.push(location);
          }
        }
      }
    }

    if (memoryImageUrls.length === 0) {
      res.status(status.bad).send({
        message: "Album images required ot create album!"
      })
      return;
    }

    const data: AlbumCreationAttributes = {
      album_name: album_name,
      user_id: user.id,
      images: memoryImageUrls,
      status: 'active'
    }

    const album = await AlbumRepository.addAlbum(data);
    res.status(status.created).send({ album });
  } catch (error: any) {
    console.error(error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong!',
    });
  }
};

export const deleteAlbum = async (req: Request, res: Response) => {
  const albumId = parseInt(req.params.id)

  if (isNaN(albumId)) {
    res.send(status.bad).send({
      message: "Album id is required to delete the album"
    });
    return;
  }
  try {
    await AlbumRepository.deleteAlbum(albumId);
    res.status(status.success).send({
      message: "Album deleted successfully!"
    })
  } catch (error) {
    console.error(error);
    res.status(status.error).json({
      status: status.error,
      message: 'Something went wrong!',
    });
  }
};

export const getAlbums = async (req: Request, res: Response) => {
  let email = req.params["email"];
  try {
    let resp = await UserRepository.getUsers(0, 1, [{ columnField: 'email', value: email, operatorValue: 'equals' }]);
    if (resp === null || resp.results.length === 0) {
      res
        .status(status.notfound)
        .send({ message: "User not registered! Contact Admin." });
      return;
    }
    const user = resp.results[0];

    let albums = await AlbumRepository.getAlbums({ user_id: user.id });

    res.status(status.success).send({
      albums: albums,
    });
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const getAlbum = async (req: Request, res: Response) => {
  const { album_id } = req.params;
  const albumId = parseInt(album_id);

  if (isNaN(albumId)) {
    res.status(status.bad).send({
      message: "Album id is required to fetch the album"
    });
    return;
  }

  try {
    let albums = await AlbumRepository.getAlbums({ id: albumId });
    res.status(status.success).send(albums.length === 1 ? albums[0] : null);
  } catch (error: any) {
    res.status(status.error).json({
      status: status.error,
      message: error.message,
    });
  }
};

export const updateAlbum = async (req: Request, res: Response) => {
  const { album_id, files } = req.body;
  
  try {
    const images = JSON.parse(files)
    let albums = await AlbumRepository.getAlbums({ id: album_id });
    if (albums.length !== 1) {
      res.status(status.bad).send({
        message: "Album not found!"
      });
      return;
    }

    const album = albums[0];
    let memoryImageUrls = [];
    if (images && images.length > 0) {
      for (const image of images) {
        if (image.file_name) {
          const location = await UploadFileToS3(image.file_name, "albums", album.album_name);
          if (location !== "") {
            memoryImageUrls.push(location);
          }
        } else if (image.file_url) {
          memoryImageUrls.push(image.file_url)
        }
      }
    }

    album.images = memoryImageUrls;
    album.updated_at = new Date();
    const updated = await album.save();
    res.status(status.success).send(updated);
  } catch (error: any) {
    console.log("[ERROR]", "AlbumController::updateAlbum", error);
    res.status(status.error).json({
      status: status.error,
      message: "Something went wrong. Please try again after some time!",
    });
  }
};
