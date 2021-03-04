import { Middleware } from "@reduxjs/toolkit";
import { Manager } from "socket.io-client";

import { api } from "@iris/api";

import { UPDATE_IMAGE } from "./data";
import { decrementSaving, incrementSaving } from "./meta";
import { SET_HEADCOUNT } from "./room";
import store, { ProjectState } from "./store";

const manager = new Manager();
const socket = manager.socket("/");

socket.on("headcount", (res: number) => {
  store.dispatch(SET_HEADCOUNT(res));
});

socket.on("patch", (res: any) => {
  console.log("received patch", res);
  store.dispatch({ ...res, meta: { socket: true } });
});

// TODO
socket.emit("join", { image: "boop" });

export const persist: Middleware = (storeAPI) => (next) => async (action) => {
  const result = next(action);
  const shouldEmit = action.meta?.socket !== true;

  const state = storeAPI.getState() as ProjectState;

  if (
    action.type.includes("[data]") ||
    action.type.includes("[delete-images]") ||
    action.type.includes("[upload-images]")
  ) {
    storeAPI.dispatch(incrementSaving());
  }

  if (action.type.includes("[data]") && shouldEmit) {
    socket.emit("patch", action);

    try {
      await api.put("/project", {
        query: { projectID: state.meta.id },
        headers: {
          "Content-Type": "application/json",
        },
        json: {
          version: "v2",
          labels: state.data.labels.data,
          images: state.data.images.data,
          annotations: state.data.annotations.data,
        },
      });
    } catch {
      // TODO
    }
  }

  if (action.type.includes("[delete-images]")) {
    // TODO:
    // const promises = action.payload.map(async (image: string) => {
    //   try {
    //     await api.del("/images/:imageID", {
    //       path: { imageID: image },
    //       query: {
    //         projectID: state.meta.id,
    //       },
    //     });
    //   } catch {
    //     // TODO
    //   }
    // });
    // await Promise.all(promises);
  }

  if (action.type.includes("[upload-images]")) {
    const promises = action.payload.map(async (jpeg: any) => {
      const formData = new FormData();
      formData.append(jpeg.name, jpeg.blob);
      storeAPI.dispatch(
        UPDATE_IMAGE({
          id: jpeg.name,
          status: "pending",
          date: "",
          annotations: [],
        })
      );
      try {
        await api.post("/images", {
          query: {
            projectID: state.meta.id,
          },
          body: formData,
        });
        storeAPI.dispatch(
          UPDATE_IMAGE({
            id: jpeg.name,
            status: "success",
            date: "",
            annotations: [],
          })
        );
      } catch (e) {
        storeAPI.dispatch(
          UPDATE_IMAGE({
            id: jpeg.name,
            status: "error",
            date: "",
            annotations: [],
          })
        );
      }
    });
    await Promise.all(promises);
  }

  if (
    action.type.includes("[data]") ||
    action.type.includes("[delete-images]") ||
    action.type.includes("[upload-images]")
  ) {
    storeAPI.dispatch(decrementSaving());
  }

  return result;
};
