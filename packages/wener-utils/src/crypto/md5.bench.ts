import { createHash } from 'node:crypto';
import { Bench } from 'tinybench';
import { md5 } from './md5';

const dataset = Array.from({ length: 10000 }, (_, i) => String(Math.random() * i));
let iterations = 0;
const bench = new Bench({ iterations: 10000 });

bench
	.add('js', () => {
		iterations++;
		md5(dataset[iterations % dataset.length]);
	})
	.add('native', () => {
		iterations++;
		createHash('md5')
			.update(dataset[iterations % dataset.length])
			.digest('hex');
	});

await bench.run();
console.table(bench.table());
