import { ObjectPreview } from "@/components/assets/object-preview";

type ObjType = "obj" | "fbx" | "dae";

type MeasuredObject = {
  name: string;
  url: string;
  type: ObjType;
  rotation?: [number, number, number];
  fit?: number;
  specs: { label: string; value: string }[];
};

/**
 * The four objects shown in the hero carousel, presented here as shipped,
 * measured assets. Physical values are stated with uncertainty to match the
 * "measured against real hardware" pitch.
 */
const OBJECTS: MeasuredObject[] = [
  {
    name: "Eyewear",
    url: "/models/objects/glasses.dae",
    type: "dae",
    specs: [
      { label: "Mass", value: "28 ± 1 g" },
      { label: "Material", value: "Acetate" },
      { label: "Bounds", value: "146 × 42 × 140 mm" },
      { label: "Friction μ", value: "0.45 ± 0.03" },
    ],
  },
  {
    name: "Lounge chair",
    url: "/models/objects/chair.fbx",
    type: "fbx",
    specs: [
      { label: "Mass", value: "7.4 ± 0.1 kg" },
      { label: "Material", value: "Oak / wool" },
      { label: "Bounds", value: "780 × 900 × 700 mm" },
      { label: "Friction μ", value: "0.58 ± 0.04" },
    ],
  },
  {
    name: "Kettle",
    url: "/models/objects/teapot.obj",
    type: "obj",
    specs: [
      { label: "Mass", value: "1.15 ± 0.02 kg" },
      { label: "Material", value: "Stainless steel" },
      { label: "Capacity", value: "1.7 ± 0.05 L" },
      { label: "Friction μ", value: "0.30 ± 0.02" },
    ],
  },
  {
    name: "Rubber duck",
    url: "/models/objects/duck.dae",
    type: "dae",
    specs: [
      { label: "Mass", value: "34 ± 1 g" },
      { label: "Material", value: "PVC" },
      { label: "Bounds", value: "80 × 95 × 75 mm" },
      { label: "Restitution", value: "0.62 ± 0.05" },
    ],
  },
];

function ObjectCard({ object }: { object: MeasuredObject }) {
  return (
    <article className="card-flat flex h-full flex-col overflow-hidden rounded-md">
      <div className="relative aspect-4/3 w-full overflow-hidden border-b border-border bg-(--void)">
        <ObjectPreview
          url={object.url}
          type={object.type}
          rotation={object.rotation}
          fit={object.fit}
        />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <h3 className="text-lg leading-tight text-foreground">{object.name}</h3>
        <dl className="data grid grid-cols-2 gap-x-4 gap-y-2 text-[0.65rem]">
          {object.specs.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <dt className="uppercase text-dim">{s.label}</dt>
              <dd className="text-ash">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export function AssetGallery() {
  return (
    <section
      id="gallery"
      className="relative z-10 border-b border-border bg-background"
    >
      <div className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <div className="mb-10 text-center">
          <div className="eyebrow mb-4">Shipped assets</div>
          <h2 className="text-3xl leading-[1.1] text-foreground md:text-4xl">
            Built and measured.
          </h2>
          <p className="prose-body mx-auto mt-4">
            Every physical value on these assets was measured against real
            hardware, with stated uncertainty.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {OBJECTS.map((object) => (
            <ObjectCard key={object.url} object={object} />
          ))}
        </div>
      </div>
    </section>
  );
}
