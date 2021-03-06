import fs from 'fs-extra';
import path from 'path';
import BaseTask from './BaseTask';

/**
 * Defines the base interface for all other file based tasks
 */
export default class BaseFileTask extends BaseTask {

	/**
	 * Constructs a new file based task
	 *
	 * @param {Object} taskInfo Task info object with configuration options
	 * @param {Array.<String>|Set.<String>} taskInfo.inputFiles Set of full paths to input files
	 */
	constructor(taskInfo) {
		super(taskInfo);

		this._inputFiles = new Set(taskInfo.inputFiles || []);
		this._outputFiles = new Set();
		this._registeredOutputPaths = new Set();
	}

	/**
	 * Gets the complete list of input files
	 *
	 * @return {Set.<String>} Array with full path to input files
	 */
	get inputFiles() {
		return this._inputFiles;
	}

	/**
	 * Sets the input files for this task.
	 *
	 * This will overwrite any existing input files this task already has. Use
	 * addInputFile or addInputDirectory to add new files to the existing ones.
	 *
	 * @param {Array.<String>|Set.<String>} inputFiles Set of full paths to input files
	 */
	set inputFiles(inputFiles) {
		this._inputFiles = new Set(inputFiles);
	}

	/**
	 * Gets all output files that the task produced
	 *
	 * @return {Set.<String>}
	 */
	get outputFiles() {
		return this._outputFiles;
	}

	/**
	 * Adds a new file to this task's input files
	 *
	 * @param {String} pathAndFilename Full path of the file to add
	 */
	addInputFile(pathAndFilename) {
		if (!fs.existsSync(pathAndFilename)) {
			throw new Error(`Input file ${pathAndFilename} does not exist.`);
		}

		if (!this.inputFiles.has(pathAndFilename)) {
			this.inputFiles.add(pathAndFilename);
		}
	}

	/**
	 * Adds all files under the given path to this task's input files
	 *
	 * @param {String} inputPath Full path of the directory to add
	 */
	addInputDirectory(inputPath) {
		if (!fs.existsSync(inputPath)) {
			return;
		}

		for (let entryName of fs.readdirSync(inputPath)) {
			let fullPath = path.join(inputPath, entryName);
			let stats = fs.lstatSync(fullPath);
			if (stats.isDirectory()) {
				this.addInputDirectory(fullPath);
			} else if (stats.isFile()) {
				this.addInputFile(fullPath);
			}
		}
	}

	/**
	 * Adds a new file to this task's output files
	 *
	 * @param {String} pathAndFilename Full path of the file to add
	 */
	addOutputFile(pathAndFilename) {
		if (!fs.existsSync(pathAndFilename)) {
			throw new Error(`Output file ${pathAndFilename} does not exist.`);
		}

		if (!this.outputFiles.has(pathAndFilename)) {
			this.outputFiles.add(pathAndFilename);
		}
	}

	/**
	 * Adds all files under the given path to this task's output files
	 *
	 * @param {String} inputPath Full path of the directory to add
	 */
	addOutputDirectory(outputPath) {
		if (!fs.existsSync(outputPath)) {
			return;
		}

		for (let entryName of fs.readdirSync(outputPath)) {
			let fullPath = path.join(outputPath, entryName);
			let stats = fs.lstatSync(fullPath);
			if (stats.isDirectory()) {
				this.addOutputDirectory(fullPath);
			} else if (stats.isFile()) {
				this.addOutputFile(fullPath);
			}
		}
	}

	/**
	 * Registers a path to be checked when creating the list of generated
	 * output files
	 *
	 * @param {String} outputPath Full path of the file or directory to register
	 */
	registerOutputPath(outputPath) {
		this._registeredOutputPaths.add(outputPath);
	}

	/**
	 * Will run after the task's action method and add any registered output paths
	 * to the task's output files
	 *
	 * @return {Promise}
	 */
	afterTaskAction() {
		for (let outputPath of this._registeredOutputPaths) {
			let stats = fs.lstatSync(outputPath);
			if (stats.isDirectory()) {
				this.addOutputDirectory(outputPath);
			} else if (stats.isFile()) {
				this.addOutputFile(outputPath);
			}
		}

		return Promise.resolve();
	}

}
