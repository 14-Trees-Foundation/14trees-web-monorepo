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
import Valwa from "../../src/assets/images/Valwa.png";

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
  Valwa,
};

export const treeList = [
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
  "Valwa",
];

export const treeListWithImages = {
    Apta: Apta,
    Awala: Awala,
    Behada: Behada,
    Bibba: Bibba,
    Chinch: Chinch,
    Kanchan: Kanchan,
    Karanj: Karanj,
    Kawath: Kawath,
    Moha: Moha,
    Palas: Palas,
    Pimpal: Pimpal,
    Sheesham: Sheesham,
    Sisu: Sisu,
    Valwa: Valwa,
}

export function getTreeTemplateName(nameLike: string) {
    // optimistic matching/search for tree name
    // namelike could have more text than just tree name
    // so we are doing a contains search
    const treeName = treeList.find((tree) => nameLike.includes(tree));
    return treeName || null;
}

export function getTreeTemplateImage(treeName: typeof treeList[number]) {
    if (!treeName || !treeListWithImages[treeName]) {
        return null;
    }
    return treeListWithImages[treeName].src;
}