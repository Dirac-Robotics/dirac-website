import * as THREE from "three";

// Match the corrected EF-room demo: furniture below the board, with wall clearance.
const CHAIR_CAPTURE_OFFSET = new THREE.Vector3(1.53261, 0, 0.18945);
const TABLE_CAPTURE_OFFSET = new THREE.Vector3(-2.04614, 0, 1.37378);

export const EF_ROOM_CAMERA: [number, number, number] = [0, 2.2, -5.2];

/** Clone before applying capture poses and WebGL material fixes to cached GLTF data. */
export function prepareEfRoom(scene: THREE.Group) {
  const clone = scene.clone(true);
  clone.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    if (mesh.name.includes("ChairAsset_v5_")) {
      mesh.position.add(CHAIR_CAPTURE_OFFSET);
    } else if (mesh.name.includes("TableAsset_v5_")) {
      mesh.position.add(TABLE_CAPTURE_OFFSET);
    }

    if (
      mesh.name.includes("AcrylicReflectionVeil") ||
      mesh.name.includes("ClearAcrylic")
    ) {
      mesh.visible = false;
      return;
    }

    const isBoardDecal = mesh.name.includes(
      "CenteredSourceTextDecal",
    );
    const isFloor = mesh.name.includes("Room_Floor_Surface");

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : [mesh.material];
    const nextMaterials = materials.map((source) => {
      const material = source.clone();
      if (isBoardDecal) {
        material.side = THREE.FrontSide;
        material.transparent = true;
        material.depthWrite = false;
        material.alphaTest = 0.02;
        material.polygonOffset = true;
        material.polygonOffsetFactor = -4;
        material.polygonOffsetUnits = -4;
      }
      if (isFloor && material instanceof THREE.MeshStandardMaterial) {
        material.roughnessMap = null;
        material.roughness = 0.86;
        material.envMapIntensity = 0.18;
        material.needsUpdate = true;
      }
      return material;
    });
    mesh.material = Array.isArray(mesh.material)
      ? nextMaterials
      : nextMaterials[0];
    mesh.renderOrder = isBoardDecal ? 2 : 0;
    mesh.castShadow =
      !isBoardDecal &&
      !mesh.name.includes("BackgroundAsset_Room_");
    mesh.receiveShadow = true;
  });
  return clone;
}
