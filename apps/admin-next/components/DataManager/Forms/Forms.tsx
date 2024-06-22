"use client"

import * as React from "react";
import { useSetRecoilState } from "recoil";

import Spinner from "components/Spinner";
import Axios from "~/api";
import { AssignTree } from "./components/AssignTree";
import { AddOrg } from "./components/Addorg";
import { AddTree } from "./components/Addtree";
import { TreeList } from "./components/TreeList";
import { treeTypesList } from "~/store";
import { AddPlot } from "./components/AddPlot";
import { AddTreeType } from './components/AddTreeType';
import { useState } from "react";
import { HeaderControlRow } from "components/HeaderControlRow";

export const Forms = () => {
  const [loading, setLoading] = React.useState(true);
  const setTreeTypeslist = useSetRecoilState(treeTypesList);
  const [selTrees, setSelectedTrees] = React.useState("");

  const fetchData = React.useCallback(async () => {
    setLoading(true);
    try {
      let TreeRes = await Axios.get(`/trees/treetypes`);
      if (TreeRes.status === 200) {
        setTreeTypeslist(TreeRes.data);
      }
    } catch (error) {
      console.log(error);
    }
    setLoading(false);
  }, [setTreeTypeslist]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onTreeSelect = (val) => {
    if (selTrees === "") {
      setSelectedTrees(val);
    } else {
      let trees = selTrees + "," + val;
      trees = Array.from(new Set(trees.split(','))).toString();
      setSelectedTrees(trees);
    }
  };

  const onTreesChanged = (val) => {
    setSelectedTrees(val);
  };

  const [activeTab, setActiveTab] = useState(0)

  if (loading) {
    return <Spinner/>;
  }

  return (
    <div>
      <div className="m-">
        <HeaderControlRow 
          className="text-white"
          buttonClass="text-white"
          items={[
            "Assign Trees",
            "Add Tree Type",
            "Add Org",
            "Add Plot",
            "Add Tree",
          ].map((title,i) => ({
            content: <div className="text-gray-100 p-2 rounded">{title}</div>,
            onClick: () => setActiveTab(i),
          }))} />
      </div>
      <div className="ml-2">
        {activeTab === 0 && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <TreeList onTreeSelect={onTreeSelect} />
            </div>
            <div>
              <AssignTree selTrees={selTrees} onTreesChanged={onTreesChanged} />
            </div>
          </div>
        )}
        {activeTab === 1 && <AddTreeType />}
        {activeTab === 2 && <AddOrg />}
        {activeTab === 3 && <AddPlot />}
        {activeTab === 4 && <AddTree />}
      </div>
    </div>
  );
};
