/**
 * @license
 * Copyright 2019 Purify Foundation. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

import * as tf from '@tensorflow/tfjs';
//import imageSqResizer from './image-square-resizer';

export const CLASS_NAMES = {
	0: 'benign',
	1: 'malign'
}

const MOBILENET_MODEL_PATH = 'http://data.purify.ai/models/geacc-visual/tfjs/mobilenetv2-224/model.json?ref=jsdemo';

const IMAGE_SIZE = 224;
const TOPK_PREDICTIONS = 1;

let mobilenet;
const mobilenetDemo = async () => {
	status('Loading model...');

	mobilenet = await tf.loadLayersModel(MOBILENET_MODEL_PATH);

	// Warmup the model. This isn't necessary, but makes the first prediction
	// faster. Call `dispose` to release the WebGL memory allocated for the return
	// value of `predict`.
	mobilenet.predict(tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3])).dispose();

	status('');

	// Make a prediction through the locally hosted cat.jpg.
	const catElement = document.getElementById('cat');
	if (catElement.complete && catElement.naturalHeight !== 0) {
		predict(catElement);
		catElement.style.display = '';
	} else {
		catElement.onload = () => {
			predict(catElement);
			catElement.style.display = '';
		}
	}

	document.getElementById('file-container').style.display = '';
};

/**
 * Given an image element, makes a prediction through mobilenet returning the
 * probabilities of the top K classes.
 *
 * @param imgElement Input image with WxH equal to IMAGE_SIZE x IMAGE_SIZE
 */
async function predict(imgElement) {
	status('Predicting...');

	const startTime = performance.now();

	const logits = tf.tidy(() => {
		// tf.fromPixels() returns a Tensor from an image element.
		const img = tf.browser.fromPixels(imgElement).toFloat();

		const offset = tf.scalar(127.5);
		// Normalize the image from [0, 255] to [-1, 1].
		const normalized = img.sub(offset).div(offset);

		// Reshape to a single-element batch so we can pass it to predict.
		const batched = normalized.reshape([1, IMAGE_SIZE, IMAGE_SIZE, 3]);

		// Make a prediction through mobilenet.
		return mobilenet.predict(batched);
	});

	// Convert logits to probabilities and class names.
	const classes = await getTopKClasses(logits, TOPK_PREDICTIONS);
	const totalTime = performance.now() - startTime;
	status(`Done in ${Math.floor(totalTime)}ms`);

	// Show the classes in the DOM.
	showResults(imgElement, classes);
}

/**
 * Computes the probabilities of the topK classes given logits by computing
 * softmax to get probabilities and then sorting the probabilities.
 * @param logits Tensor representing the logits from MobileNet.
 * @param topK The number of top predictions to show.
 */
export async function getTopKClasses(logits, topK) {
	const values = await logits.data();

	const valuesAndIndices = [];
	for (let i = 0; i < values.length; i++) {
		valuesAndIndices.push({ value: values[i], index: i });
	}
	valuesAndIndices.sort((a, b) => {
		return b.value - a.value;
	});
	const topkValues = new Float32Array(topK);
	const topkIndices = new Int32Array(topK);
	for (let i = 0; i < topK; i++) {
		topkValues[i] = valuesAndIndices[i].value;
		topkIndices[i] = valuesAndIndices[i].index;
	}

	const topClassesAndProbs = [];
	for (let i = 0; i < topkIndices.length; i++) {
		topClassesAndProbs.push({
			className: CLASS_NAMES[topkIndices[i]],
			probability: topkValues[i]
		})
	}
	return topClassesAndProbs;
}

//
// UI
//

function showResults(imgElement, classes) {
	const predictionTr = predictionsTable.tBodies[0].insertRow(0);

	const imgTd = predictionTr.insertCell(0);
	imgTd.appendChild(imgElement);

	const classTd = predictionTr.insertCell(1);
	classTd.innerText = classes[0].className;

	const probsTd = predictionTr.insertCell(2);
	probsTd.innerText = classes[0].probability.toFixed(4);

	const filenameTd = predictionTr.insertCell(3);
	filenameTd.innerText = imgElement.title;
}

const filesElement = document.getElementById('files');
filesElement.addEventListener('change', evt => {
	let files = evt.target.files;
	// Display thumbnails & issue call to predict each image.
	for (let i = 0, f; f = files[i]; i++) {
		// Only process image files (skip non image files)
		if (!f.type.match('image.*')) {
			continue;
		}

		let reader = new FileReader();
		const idx = i;
		// Closure to capture the file information.
		reader.onload = e => {
			// Fill the image & call predict.
			let img = document.createElement('img');
			img.title = f.name;
			img.src = e.target.result;
			img.width = IMAGE_SIZE;
			img.height = IMAGE_SIZE;
			img.onload = () => predict(img);
		};

		// Read in the image file as a data URL.
		reader.readAsDataURL(f);

		// Alternative approach to the default squeezing into square: Resize and crop the center of the image
		// let img = document.createElement('img');
		// img.title = f.name;
		// img.width = IMAGE_SIZE;
		// img.height = IMAGE_SIZE;
		// let resized_img = new imageSqResizer(f, IMAGE_SIZE, (dataUrl) => img.src = dataUrl);
		// img.onload = () => predict(img);
	}
});

const status = msg => console.log(msg);

const predictionsTable = document.getElementById('predictions');

mobilenetDemo();