import * as THREE from './assets/js/three.module.js'
import { OrbitControls } from './assets/js/OrbitControls.js'

new class {
	constructor() {
		this.init_three()
			.init_helpers()
			.init_controls()
			.main()
		this.render().update()
	}
	update(time = 0) {
		requestAnimationFrame((time) => this.update(time))
		Object.values(this.objects).map(obj => { if (obj.update) obj.update(time / 10000) })

		this.render()
		return this
	}
	main() {
		this.add_starts()
		this.objects = {
			'moon': this.add_moon(this.scene)
		}
		this.camera_follow(this.objects.moon)
	}
	camera_follow(obj) {
		obj.add(this.camera)
	}
	add_moon(scene) {
		let real_moon = new THREE.Mesh(
			new THREE.SphereGeometry(3, 32, 32),
			new THREE.MeshStandardMaterial({
				map: new THREE.TextureLoader().load('./assets/img/moon.jpg'),
				normalMap: new THREE.TextureLoader().load('./assets/img/normal.jpg'),
			})
		);
		let moon = new THREE.Object3D
		moon.add(real_moon)

		moon.update = (time) => {
			moon.position.x = Math.cos(time) * 15
			moon.position.z = Math.sin(time) * 15
			real_moon.rotation.y += 0.01
		}

		if (scene) scene.add(moon)
		return moon
	}

	add_starts() {
		let addStar = () => {
			const geometry = new THREE.SphereGeometry(0.25, 24, 24)
			const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
			const star = new THREE.Mesh(geometry, material)
			const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread(600))
			star.position.set(x, y, z)
			this.scene.add(star)
		}

		Array(200).fill().map(addStar)
	}

	//init
	init_three() {
		this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 1000)
		this.camera.position.set(0, 20, -20)

		this.scene = new THREE.Scene()
		this.camera.lookAt(this.scene.position)

		this.ambientLight = new THREE.AmbientLight(0xffffff, 1);
		this.scene.add(this.ambientLight);

		this.renderer = new THREE.WebGLRenderer({ antialias: true })
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		document.body.appendChild(this.renderer.domElement)
		window.addEventListener('resize', () => this.on_window_resize())
		return this
	}
	on_window_resize() {
		this.camera.aspect = window.innerWidth / window.innerHeight
		this.camera.updateProjectionMatrix()
		this.renderer.setSize(window.innerWidth, window.innerHeight)
		return this.render()
	}
	init_helpers() {
		this.scene.add(new THREE.GridHelper(200, 50))
		this.scene.add(new THREE.AxesHelper(200, 50))
		return this
	}
	init_controls() {
		this.controls = new OrbitControls(this.camera, this.renderer.domElement)
		return this
	}
	render() {
		this.renderer.render(this.scene, this.camera)
		return this
	}
}