
const path   = require('path');
const fs     = require('fs');
const tga    = require(path.normalize(__dirname + '/tga.js'));
const ldr    = new THREE.DDSLoader();
const ldrTGA = new THREE.TGALoader();
const os     = require('os');
const dxt    = require('decode-dxt');
const {ipcRenderer} = require('electron');
const remote = require('electron').remote;
//const ddsldr = new THREE.aDDSLoader();

let num_cpus = os.cpus().length;

// create n - 1 workers
/*
const workers = [];
for (let i = 0; i < Math.max(1, num_cpus - 1); i++) {
  workers.push(new Worker('worker.js'));
}
*/

// drag and drop handlers
window.ondragend = (ev) => {
  //$('div.underlay').removeClass('drag-hover');
  document.querySelector('div.underlay').classList.remove('drag-hover');
  app_ui.drag_active = false;
  return false;
}
window.ondragleave = (ev) => {
  //$('div.underlay').removeClass('drag-hover');
  document.querySelector('div.underlay').classList.remove('drag-hover');
  app_ui.drag_active = false;
  return false;
}
window.ondragover = (ev) => {
  //$('div.underlay').addClass('drag-hover');
  document.querySelector('div.underlay').classList.add('drag-hover');
  app_ui.drag_active = true;
  return false;
}
window.ondrop = (ev) => {
  ev.preventDefault();
  document.querySelector('div.underlay').classList.remove('drag-hover');
  app_ui.drag_active = false;
  //$('div.underlay').removeClass('drag-hover');
  if (!ev.dataTransfer ||
      !ev.dataTransfer.files ||
      !ev.dataTransfer.files.length) {
    return false;
  }
  let txi_file = null;
  for (let file of ev.dataTransfer.files) {
    const t1 = Date.now();
    //console.log(this);
    // this gets us into the vue-based config
    console.log(app_ui.config);
    const absfile = file.path;
    if (absfile.match(/\.dds$/i)) {
      ldr.load(absfile, (img) => {
        console.log(img);
        const t2 = Date.now();
        make_canvas(img, app_ui.config).then((cv) => {
          const t3 = Date.now();
          //document.body.firstChild.innerHTML = '';
          if (!document.querySelector('canvas')) {
            document.querySelector('.viewer').appendChild(cv);
          }
          let suffix = '';
          if (app_ui.config.export_naming == 'suffix_all') {
            suffix = '_new';
          }
          // write out a TGA image file
          const tga_filename = path.join(
            path.dirname(absfile), (path.basename(absfile, '.dds') + suffix + '.tga')
          );
          console.log(tga_filename);
          //tga.writeTGA(cv, tga_filename, { pixel_size: img.pixelDepth });
          tga.writeTGA(cv, tga_filename, { pixel_size: 32 });
          // print timing info
          const t_load = (t2 - t1) / 1000.0;
          const t_proc = (t3 - t2) / 1000.0;
          const t_write = (Date.now() - t3) / 1000.0;
          const t_delta = (Date.now() - t1) / 1000.0;
          console.debug('loaded in '    + t_load.toFixed(4) + "s");
          console.debug('processed in ' + t_proc.toFixed(4) + "s");
          console.debug('written in '   + t_write.toFixed(4) + "s");
          console.log('processed in ' + t_delta.toFixed(4) + "s");
        });
        /*
        let cv = make_canvas(img);
        document.body.firstChild.innerHTML = '';
        document.body.firstChild.appendChild(cv);
        // write out a TGA image file
        const tga_filename = path.join(
          path.dirname(absfile), (path.basename(absfile, '.dds') + '.tga')
        );
        console.log(tga_filename);
        //tga.writeTGA(cv, tga_filename, { pixel_size: img.pixelDepth });
        tga.writeTGA(cv, tga_filename, { pixel_size: 32 });
        */
      });
    }
    if (absfile.match(/\.tga$/i)) {
      ldrTGA.load(absfile, (img) => {
        console.log(img);
        const t2 = Date.now();
        make_canvas(img, app_ui.config).then((cv) => {
          const t3 = Date.now();
          //document.body.firstChild.innerHTML = '';
          if (!document.querySelector('canvas')) {
            document.querySelector('.viewer').appendChild(cv);
          }
          let suffix = '';
          if (app_ui.config.export_naming == 'suffix' ||
              app_ui.config.export_naming == 'suffix_all') {
            suffix = '_new';
          }
          // write out a TGA image file
          const tga_filename = path.join(
            path.dirname(absfile), (path.basename(absfile, '.tga') + suffix + '.tga')
          );
          console.log(tga_filename);
          //tga.writeTGA(cv, tga_filename, { pixel_size: img.pixelDepth });
          tga.writeTGA(cv, tga_filename, { pixel_size: 32 });
          // print timing info
          const t_load = (t2 - t1) / 1000.0;
          const t_proc = (t3 - t2) / 1000.0;
          const t_write = (Date.now() - t3) / 1000.0;
          const t_delta = (Date.now() - t1) / 1000.0;
          console.debug('loaded in '    + t_load.toFixed(4) + "s");
          console.debug('processed in ' + t_proc.toFixed(4) + "s");
          console.debug('written in '   + t_write.toFixed(4) + "s");
          console.log('processed in ' + t_delta.toFixed(4) + "s");
        });
        /*
        let cv = make_canvas(img);
        document.body.firstChild.innerHTML = '';
        document.body.firstChild.appendChild(cv);
        // write out a TGA image file
        const tga_filename = path.join(
          path.dirname(absfile), (path.basename(absfile, '.dds') + '.tga')
        );
        console.log(tga_filename);
        //tga.writeTGA(cv, tga_filename, { pixel_size: img.pixelDepth });
        tga.writeTGA(cv, tga_filename, { pixel_size: 32 });
        */
      });
    }
  }
}

function make_canvas(img, config) {
  let canvas = document.querySelector('canvas') || document.createElement('canvas');
  canvas.width = img.image.width;
  canvas.height = img.image.height;
  let context = canvas.getContext( '2d' );
  let imageData = context.createImageData( img.image.width, img.image.height );
  //console.log(img.image.width * img.image.height * 4);
  console.log(img);
  let image;
  if (img.format == THREE.RGBA_S3TC_DXT5_Format) {
    /*
    console.log(img.byteOffset);
    console.log(img.byteLength);
    console.log(img.buffer.byteLength);
    console.log(img);
    */
    //let image = dxt(new DataView(img.buffer, img.byteOffset, img.byteLength), header.frame_width, header.frame_height, dxt.dxt1);
    // offset 128 because I guess the DDSLoader injects DDS headers into the mipmaps? or something?
    image = dxt(
      new DataView(img.mipmaps[0].data.buffer, 128, img.mipmaps[0].data.byteLength),
      img.image.width, img.image.height, dxt.dxt5
    );
    //console.log(image);
  } else if (img.format == THREE.RGBAFormat) {
    // image = img.image/getImageData?
    const ctx = img.image.getContext('2d');
    image = ctx.getImageData(0, 0, img.image.width, img.image.height).data;
    //document.body.append(img.image);
  }

  let i = 0, x, y;
  let width = img.image.width;

  // ready for an architecture that handles multiproc,
  // but here, this is just lip service non-blocking
  //const batches = Math.ceil(img.image.height / 128);
  //const batches = workers.length;
  const batches = 15;
  let lines_per_cpu = Math.floor(img.image.height / batches);
  let lines_leftover = img.image.height - (lines_per_cpu * batches);

  let line_procs = [];
  for (i = 0; i < batches; i++) {
    line_procs.push(new Promise((resolve, reject) => {
      const line_start = i * lines_per_cpu;
      if (config.mode == 'mapping') process_lines_v1(
        resolve, config, image, img.image.width,
        line_start, line_start + lines_per_cpu + (i == batches - 1 ? lines_leftover : 0),
        imageData
      );
      if (config.mode == 'normalize') process_lines_normalize(
        resolve, config, image, img.image.width,
        line_start, line_start + lines_per_cpu + (i == batches - 1 ? lines_leftover : 0),
        imageData
      );

      /*
      process_lines(
        resolve, workers[i], image, img.image.width,
        line_start, line_start + lines_per_cpu + (i == batches - 1 ? lines_leftover : 0),
        imageData
      );
      */
    }));
  }
  //return Promise.all(line_procs).then(function(results) {
  return Promise.all(line_procs).then(function(results) {
    //XXX error handling via results
    /*
    let data_offset = 0;
    for (const res of results) {
      imageData.data.set(res, data_offset);
      data_offset += res.byteLength;
    }
    */
    context.putImageData(imageData, 0, 0);
    return canvas;
    //resolve(canvas);
  });

  /* blocking IO method
  let y_start = 0, y_end = img.image.height, y_step = 1;
  let x_start = 0, x_end = img.image.width, x_step = 1;

  for ( y = y_start; y !== y_end; y += y_step ) {

    for ( x = x_start; x !== x_end; x += x_step, i += 4 ) {

      //imageData.data[ ( x + width * y ) * 4 + 0 ] = image[ i + 0 ];
      //imageData.data[ ( x + width * y ) * 4 + 1 ] = image[ i + 1 ];
      //imageData.data[ ( x + width * y ) * 4 + 2 ] = image[ i + 2 ];
      //imageData.data[ ( x + width * y ) * 4 + 3 ] = image[ i + 3 ];
      // 0-255 = 0-1, 2n-1 = final value
      let vector = [ image[ i + 3 ], image[ i + 1 ], 0 ];
      vector[0] = (2 * (vector[0] / 255.0)) - 1.0;
      vector[1] = (2 * (vector[1] / 255.0)) - 1.0;
      // directX to opengl
      vector[1] *= -1.0;
      vector[2] = Math.sqrt(1.0 - Math.pow(vector[0], 2) - Math.pow(vector[1], 2));
      //console.log(vector);

      imageData.data[ ( x + width * y ) * 4 + 0 ] = Math.round(((vector[ 0 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ ( x + width * y ) * 4 + 1 ] = Math.round(((vector[ 1 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ ( x + width * y ) * 4 + 2 ] = Math.round(((vector[ 2 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ ( x + width * y ) * 4 + 3 ] = 255;

    }

  }

  context.putImageData(imageData, 0, 0);
  return canvas;
  */
}

function process_lines(resolve, worker, pixbuf, width, line_start, line_end, imageData)
{
  let pix_offset = (width * 4) * line_start;
  let pix_size   = (width * 4) * (line_end - line_start);
  //console.log(line_start, line_end);

  worker.postMessage([
    pixbuf.subarray(pix_offset, pix_offset + pix_size),
  ]);
  worker.onmessage = (e) => {
    //console.log('from worker');
    //console.log(e);
    resolve(e.data);
    this.onmessage = null;
  }
}
function derivation_requested(config) {
  const lookup = {};
  let input_keys = ['source_red', 'source_green', 'source_blue', 'source_alpha'];
  for (const key of input_keys) {
    lookup[config[key]] = true;
  }
  if (config.target_x && !lookup.x) {
    return 'x';
  }
  if (config.target_y && !lookup.y) {
    return 'y';
  }
  if (config.target_z && !lookup.z) {
    return 'z';
  }
  return false;
}
function process_lines_normalize(resolve, config, pixbuf, width, line_start, line_end, imageData)
{
  let i = (width * 4) * line_start;
  let y_start = line_start, y_end = line_end, y_step = 1;
  let x_start = 0, x_end = width, x_step = 1;

  const source = { x: parseInt(0), y: parseInt(1), z:parseInt(2), w:parseInt(3) };
  const target_map = { r: parseInt(0), g: parseInt(1), b: parseInt(2), a: parseInt(3) };

  // want a data structure that will be 4 elements, rgba, 

  const vector = new Array(4);
  // nice thought, but cuts performance
  //const white_pixel = new Uint8Array([ 255, 255, 255, 255 ]);

  for ( y = y_start; y !== y_end; y += y_step ) {
    for ( x = x_start; x !== x_end; x += x_step, i += 4 ) {
      vector[0] = pixbuf[i + source.x];
      vector[1] = pixbuf[i + source.y];
      vector[2] = pixbuf[i + source.z];
      vector[3] = pixbuf[i + source.w];
      //console.log(i);
      //console.log(vector);
      //vector[0] = pixbuf[ i + 3 ]
      //vector[1] = pixbuf[ i + 1 ]
      //vector[2] = 0;
      vector[0] = (2 * (vector[0] / 255.0)) - 1.0;
      vector[1] = (2 * (vector[1] / 255.0)) - 1.0;
      vector[2] = (2 * (vector[2] / 255.0)) - 1.0;
      vector[3] = (2 * (vector[3] / 255.0)) - 1.0;
      // directX to opengl, remap only ... for now ... i guess
      //if (config.invert_y) {
      //  vector[1] *= -1.0;
      //}
      //vector[2] = Math.sqrt(1.0 - Math.pow(vector[0], 2) - Math.pow(vector[1], 2));
      if (config.normalize_target) vector[target_map[config.normalize_target]] = Math.sqrt(
        1.0 -
        (config.normalize_ch1 ? Math.pow(vector[target_map[config.normalize_ch1]], 2) : 0) -
        (config.normalize_ch2 ? Math.pow(vector[target_map[config.normalize_ch2]], 2) : 0) -
        (config.normalize_ch3 ? Math.pow(vector[target_map[config.normalize_ch3]], 2) : 0)
      );
      //console.log(vector);
      //console.log(i + 3);
      //imageData.data[ i + 0 ] = pixbuf[i + source.x]; //Math.round(((vector[ 0 ] + 1.0) * 0.5) * 255.0);
      //imageData.data[ i + 1 ] = pixbuf[i + source.y]; //Math.round(((vector[ 1 ] + 1.0) * 0.5) * 255.0);
      //imageData.data[ i + 2 ] = pixbuf[i + 2]; //Math.round(((vector[ 2 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ i + 0 ] = Math.round(((vector[ 0 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ i + 1 ] = Math.round(((vector[ 1 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ i + 2 ] = Math.round(((vector[ 2 ] + 1.0) * 0.5) * 255.0);
      //imageData.data[ i + 3 ] = pixbuf[i + 3]; //Math.round(((vector[ 2 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ i + 3 ] = Math.round(((vector[ 3 ] + 1.0) * 0.5) * 255.0);
    }
  }
  resolve && resolve();
}
function process_lines_v1(resolve, config, pixbuf, width, line_start, line_end, imageData)
{
  let i = (width * 4) * line_start;
  let y_start = line_start, y_end = line_end, y_step = 1;
  let x_start = 0, x_end = width, x_step = 1;

  const derivation = derivation_requested(config); 
  console.log(derivation);

  let source = { x: null, y:null, z:null, height:null, spec:null };
  const source_keys = ['source_red', 'source_green', 'source_blue', 'source_alpha'];
  for (let key_index in source_keys) {
    if (config[source_keys[key_index]]) {
      // source.x = 0 if red, source.x = 3 if alpha, matching offset into pixel data
      source[config[source_keys[key_index]]] = parseInt(key_index);
    }
  }
  console.log(source);
  
  const derive_map = { x: parseInt(0), y: parseInt(1), z: parseInt(2) };
  const derive_comp_map = { x: [1, 2], y: [0, 2], z: [0, 1] };

  const target_map = { r: parseInt(0), g: parseInt(1), b: parseInt(2), a: parseInt(3) };

  // want a data structure that will be 4 elements, rgba, 

  const vector = new Array(4);
  // nice thought, but cuts performance
  //const white_pixel = new Uint8Array([ 255, 255, 255, 255 ]);

  for ( y = y_start; y !== y_end; y += y_step ) {
    for ( x = x_start; x !== x_end; x += x_step, i += 4 ) {

      /*
      imageData.data[ ( x + width * y ) * 4 + 0 ] = pixbuf[ i + 0 ];
      imageData.data[ ( x + width * y ) * 4 + 1 ] = pixbuf[ i + 1 ];
      imageData.data[ ( x + width * y ) * 4 + 2 ] = pixbuf[ i + 2 ];
      imageData.data[ ( x + width * y ) * 4 + 3 ] = pixbuf[ i + 3 ];
      */
      // 0-255 = 0-1, 2n-1 = final value
      /*
      let vector1 = [
        pixbuf[i + parseInt(source.x)],
        pixbuf[i + parseInt(source.y)],
        pixbuf[i + parseInt(source.z)]
      ];
      //vector1 = vector1.map(x => (2 * (x / 255.0)) - 1.0);
      vector1[0] = (2 * (vector1[0] / 255.0)) - 1.0;
      vector1[1] = (2 * (vector1[1] / 255.0)) - 1.0;
      vector1[2] = (2 * (vector1[2] / 255.0)) - 1.0;
      if (config.invert_y) {
        vector1[1] *= -1.0;
      }
      if (derivation) {
        vector1[derive_map[derivation]] = Math.sqrt(
          1.0 -
          Math.pow(vector1[derive_comp_map[derivation][0]], 2) -
          Math.pow(vector1[derive_comp_map[derivation][1]], 2)
        );
      }
      //console.log(vector1);
      */
      //let vector = [ pixbuf[ i + 3 ], pixbuf[ i + 1 ], 0 ];
      vector[0] = pixbuf[i + source.x];
      vector[1] = pixbuf[i + source.y];
      vector[2] = pixbuf[i + source.z];
      //vector[0] = pixbuf[ i + 3 ]
      //vector[1] = pixbuf[ i + 1 ]
      //vector[2] = 0;
      vector[0] = (2 * (vector[0] / 255.0)) - 1.0;
      vector[1] = (2 * (vector[1] / 255.0)) - 1.0;
      vector[2] = (2 * (vector[2] / 255.0)) - 1.0;
      // directX to opengl
      if (config.invert_y) {
        vector[1] *= -1.0;
      }
      //vector[2] = Math.sqrt(1.0 - Math.pow(vector[0], 2) - Math.pow(vector[1], 2));
      if (derivation) vector[derive_map[derivation]] = Math.sqrt(
        1.0 - Math.pow(vector[derive_comp_map[derivation][0]], 2) -
              Math.pow(vector[derive_comp_map[derivation][1]], 2)
      );
      //console.log(vector);
      //console.log(vector, vector1);
      /*
      vector1 = vector1.map(x => Math.round(((x + 1.0) * 0.5) * 255.0));

      // initialize white pixel alpha 1.0
      imageData.data[ ( x + width * y ) * 4 + 0 ] = 255;
      imageData.data[ ( x + width * y ) * 4 + 1 ] = 255;
      imageData.data[ ( x + width * y ) * 4 + 2 ] = 255;
      imageData.data[ ( x + width * y ) * 4 + 3 ] = 255;

      if (config.target_x) {
        //imageData.data[ ( x + width * y ) * 4 + target_map[config.target_x] ] = Math.round(((vector1[ 0 ] + 1.0) * 0.5) * 255.0);
        imageData.data[ (( x + width * y ) * 4) + target_map[config.target_x] ] = vector1[ 0 ];
      }
      if (config.target_y) {
        imageData.data[ (( x + width * y ) * 4) + target_map[config.target_y] ] = vector1[ 1 ];
      }
      if (config.target_z) {
        //console.log(config.target_z); console.log(target_map[config.target_z]);
        imageData.data[ (( x + width * y ) * 4) + target_map[config.target_z] ] = vector1[ 2 ];
      }
      */
      // unfortunately, using set for 1 pixel is overkill, hurts performance
      //console.log(white_pixel);
      //imageData.data.set(white_pixel, i);
      imageData.data[ i + 0 ] = 255;
      imageData.data[ i + 1 ] = 255;
      imageData.data[ i + 2 ] = 255;
      imageData.data[ i + 3 ] = 255;
      if (config.target_x) {
        //imageData.data[ ( x + width * y ) * 4 + target_map[config.target_x] ] = Math.round(((vector[ 0 ] + 1.0) * 0.5) * 255.0);
        imageData.data[ i + target_map[config.target_x] ] = Math.round(((vector[ 0 ] + 1.0) * 0.5) * 255.0);
      }
      if (config.target_y) {
        //imageData.data[ ( x + width * y ) * 4 + target_map[config.target_y] ] = Math.round(((vector[ 1 ] + 1.0) * 0.5) * 255.0);
        imageData.data[ i + target_map[config.target_y] ] = Math.round(((vector[ 1 ] + 1.0) * 0.5) * 255.0);
      }
      if (config.target_z) {
        //imageData.data[ ( x + width * y ) * 4 + target_map[config.target_z] ] = Math.round(((vector[ 2 ] + 1.0) * 0.5) * 255.0);
        imageData.data[ i + target_map[config.target_z] ] = Math.round(((vector[ 2 ] + 1.0) * 0.5) * 255.0);
      }
      /*
      imageData.data[ ( x + width * y ) * 4 + 0 ] = Math.round(((vector[ 0 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ ( x + width * y ) * 4 + 1 ] = Math.round(((vector[ 1 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ ( x + width * y ) * 4 + 2 ] = Math.round(((vector[ 2 ] + 1.0) * 0.5) * 255.0);
      imageData.data[ ( x + width * y ) * 4 + 3 ] = 255;
      */
      //imageData.data[ i + 3 ] = 255;

    }
  }
  resolve && resolve();
}

// Vue.js interface code below this point

const chooser = {
  props: [
    'name',
    'value',
    'options',
    'assigned', // assigned elsewhere, aka unavailable
    'require',
  ],
  template: `
    <div class="row">
      <span class="col-xs-4 col-sm-3 col-sm-offset-1"><label>{{ name }}</label></span><span class="col-xs-8">
        <span v-if="!require" class="opt" :class="{selected:!value}" @click="setValue();">none</span>
        <span class="opt" v-for="opt in options" :class="{selected:value == opt.value,assigned:assigned && assigned[opt.value]}" @click="setValue(opt.value);">{{ opt.label }}</span>
      </span>
    </div>
  `,
  methods: {
    setValue: function(val) {
      //this.value = val;
      //console.log(e);
      console.log(val);
      if (this.assigned && this.assigned[val]) {
        return;
      }
      this.$emit('change', val);
    }
  },
};

const app_ui = new Vue({
  el: '#app',
  /*
  data: () => ({
    show_menu:       false,
    show_settings:   false,
  }),
  */
  created: function() {
    ipcRenderer.on('load-config', (ev, payload) => {
      if (payload) {
        this.config = payload;
      } else {
        // main process sent us an empty config,
        // meaning no configuration has been set yet,
        // give main process our default config now,
        // so it will be written upon application quit
        ipcRenderer.send('update-config', this.config);
      }
    });
  },
  beforeMount: function() {
    remote.getCurrentWebContents().emit('vue-ready');
    /*
    const config_file = app.getPath('userData') + path.sep + 'config.json';
    if (fs.existsSync(config_file)) {
      fs.readFile(config_file, (err, data) => {
        if (err) return false;
        try { this.config = JSON.parse(data); }
        catch (e) { console.log(e); }
      });
    }
    */
  },
  data: {
    //version_string: process.env.npm_package_version,
    version_string: require('./package.json').version,
    show_menu:       false,
    show_settings:   false,
    drag_active:     false,
    active_settings: 'mapping',
    config: {
      mode: 'mapping',
      source_green: 'y',
      source_alpha: 'x',
      target_x: 'r',
      target_y: 'g',
      target_z: 'b',
      invert_y: true,
      normalize_ch1: 'r',
      normalize_ch2: 'g',
      normalize_target: 'b',
      export_naming: 'suffix',
      save_config: true,
    },
    mode_icons: {
      mapping: 'transfer',
      normalize: 'equalizer',
      mix: 'duplicate',
    },
    modes: [
      {
        key: 'mapping',
        name: 'Convert / Remap',
        icon: 'transfer',
      }, {
        key: 'normalize',
        name: 'Normalize',
        icon: 'equalizer',
      },/* {
        key: 'mix',
        name: 'Mix',
        icon: 'duplicate',
      },*/
    ],
    geo_opts: [
      { label: 'x', value: 'x' },
      { label: 'y', value: 'y' },
      { label: 'z', value: 'z' },
      /*{ label: 'height', value: 'h' },
      { label: 'spec', value: 's' },*/
    ],
    bool_opts: [
      { label: 'yes', value: true },
      { label: 'no', value: false }
    ],
    color_opts: [
      { label: 'red', value: 'r' },
      { label: 'green', value: 'g' },
      { label: 'blue', value: 'b' },
      { label: 'alpha', value: 'a' },
    ],
  },
  computed: {
    modes_obj: function() {
      const modes = {};
      for (const mode of this.modes) {
        modes[mode.key] = mode;
      }
      return modes;
    },
    normalize_assigned: function() {
      const assigned = {};
      for (const val of ['r', 'g', 'b', 'a']) {
        if (this.normalize_available(val)) {
          assigned[val] = true;
        }
      }
      return assigned;
    },
    target_assigned: function() {
      const assigned = {};
      for (const val of ['r', 'g', 'b', 'a']) {
        if (this.target_available(val)) {
          assigned[val] = true;
        }
      }
      return assigned;
    },
    source_assigned: function() {
      const assigned = {};
      for (const val of ['x', 'y', 'z', 'height', 'spec']) {
        if (this.source_available(val)) {
          assigned[val] = true;
        }
      }
      return assigned;
    },
    available_x: function() {
      return (
        this.source_available('x') || (
          this.source_available('y') && this.source_available('z')
        )
      );
    },
    available_y: function() {
      return (
        this.source_available('y') || (
          this.source_available('x') && this.source_available('z')
        )
      );
    },
    available_z: function() {
      return (
        this.source_available('z') || (
          this.source_available('x') && this.source_available('y')
        )
      );
    },
    available_height: function() {
      return this.source_available('height');
    },
    available_spec: function() {
      return this.source_available('spec');
    },
  },
  methods: {
    mode_cycle: function() {
      for (let mode_key in this.modes) {
        if (this.modes[mode_key].key === this.config.mode) {
          mode_key = parseInt(mode_key);
          const next_key = mode_key + (
            (mode_key + 1 < (this.modes.length)) ? 1 : (1 - this.modes.length)
          );
          Vue.set(this.config, 'mode', this.modes[next_key].key);
          this.active_settings = this.modes[next_key].key;
          return;
        }
      }
    },
    normalize_available: function(type) {
      return (
        this.config.normalize_ch1    === type ||
        this.config.normalize_ch2    === type ||
        this.config.normalize_ch3    === type ||
        this.config.normalize_target === type
      );
    },
    target_available: function(type) {
      return (
        this.config.target_x      === type ||
        this.config.target_y      === type ||
        this.config.target_z      === type ||
        this.config.target_height === type ||
        this.config.target_spec   === type
      );
    },
    source_available: function(type) {
      return (
        this.config.source_red   === type ||
        this.config.source_green === type ||
        this.config.source_blue  === type ||
        this.config.source_alpha === type
      );
    },
    log: function (x) {
      console.log(x);
    },
    update: function(path, val) {
      const keys = path.split('.');
      const prop_key = keys.pop();
      let obj = this;
      for (const key of keys) {
        obj = obj[key];
      }
      Vue.set(obj, prop_key, val);
      // write out config file
      // app.getPath('userData') + path.sep + 'config.json'
      if (path.startsWith('config.')) {
        ipcRenderer.send('update-config', this.config);
        //this.write_config();
      }
    },
    /*
    write_config: function() {
      fs.writeFileSync(app.getPath('userData') + path.sep + 'config.json', JSON.stringify(this.config));
    },
    */
    hide_menus: function () {
      //console.log(this);
      this.show_menu = false;
      this.show_settings = false;
      //console.log('hide menus');
    }
  },
  components: {
    chooser,
  },
});
/*
*/
