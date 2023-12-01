import Apta from "../../src/assets/images/Apta.png";
import Awala from "../../src/assets/images/Awala.png";
import Behada from "../../src/assets/images/Behada.png";
import Bibba from "../../src/assets/images/Bibba.png";
import Chinch from "../../src/assets/images/Chinch.png";
import Kanchan from "../../src/assets/images/Kanchan.png";
import Karanj from "../../src/assets/images/Karanj.png";
import Kawath from "../../src/assets/images/Kawath.png";
import Moha from "../../src/assets/images/Moha.png";
import Palas from "../../src/assets/images/Palas.png";
import Pimpal from "../../src/assets/images/Pimpal.png";
import Sheesham from "../../src/assets/images/Sheesham.png";
import Sisu from "../../src/assets/images/Sisu.png";
import Vavla from "../../src/assets/images/Vavla.png";

export const templateImages = {
  Apta,
  Awala,
  Behada,
  Bibba,
  Chinch,
  Kanchan,
  Karanj,
  Kawath,
  Moha,
  Palas,
  Pimpal,
  Sheesham,
  Sisu,
  Vavla,
};

export const treeNamesMain =  [
  "Apta",
  "Awala",
  "Behada",
  "Bibba",
  "Chinch",
  "Kanchan",
  "Karanj",
  "Kawath",
  "Moha",
  "Palas",
  "Pimpal",
  "Sheesham",
  "Sisu",
  "Vavla",
]

export const treeNamesAlt = [
  // alt names
  "Amla",
  "Awla",
  "Chincha",
  "Tamarind",
];

export const treeList = [...treeNamesMain, ...treeNamesAlt];

export const treeListWithImages = {
    Apta: Apta,
    Awala: Awala,
    Amla: Awala,
    Awla: Awala,
    Behada: Behada,
    Bibba: Bibba,
    Chinch: Chinch,
    Chincha: Chinch,
    Tamarind: Chinch,
    Kanchan: Kanchan,
    Karanj: Karanj,
    Kawath: Kawath,
    Moha: Moha,
    Palas: Palas,
    Pimpal: Pimpal,
    Sheesham: Sheesham,
    Sisu: Sisu,
    Vavla: Vavla,
}

export function getTreeTemplateName(nameLike: string) {
    // optimistic matching/search for tree name
    // namelike could have more text than just tree name
    // so we are doing a contains search
    const treeName = treeList.find((tree) => nameLike.includes(tree));
    return treeName || `${nameLike} not found` ;
}

export function getTreeTemplateImage(treeName: typeof treeList[number]) {
    if (!treeName || !treeListWithImages[treeName]) {
        return null;
    }
    return treeListWithImages[treeName].src;
}