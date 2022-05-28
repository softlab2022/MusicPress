import pkg from './package';
import gulp from 'gulp';
import yargs from 'yargs';

const sass = require('gulp-sass')(require('sass'));
import autoprefixer from 'gulp-autoprefixer';
import cleanCss from 'gulp-clean-css';
import gulpif from 'gulp-if';
import sourcemaps from 'gulp-sourcemaps';
import del from 'del';
import webpack from 'webpack-stream';
import named from 'vinyl-named';
import browserSync from 'browser-sync';
import zip from 'gulp-zip';
import TerserPlugin from 'terser-webpack-plugin';

const PRODUCTION = yargs.argv.prod;
const server = browserSync.create();

const paths = {
    css: {
        src: ['src/scss/main.scss'],
        dest: 'assets/css/'
    },

    js: {
        src: [ "src/js/main.js"],
        dest: 'assets/js/'
    },

    build: {
        src: [
            '**/**',
            '!node_modules/**',
            '!block/node_modules/**',
            '!build/**',
            '!src/**',
            '!**/*.md',
            '!**/*.map',
            '!**/*.sh',
            '!.idea/**',
            '!bin/**',
            '!.git/**',
            '!gulpfile.babel.js',
            '!package.json',
            '!composer.json',
            '!composer.lock',
            '!package-lock.json',
            '!debug.log',
            '!none',
            '!.babelrc',
            '!.gitignore',
            '!.gitmodules',
            '!phpcs.xml.dist',
            '!npm-debug.log',
            '!plugin-deploy.sh',
            '!export.sh',
            '!config.codekit',
            '!nbproject/*',
            '!tests/**',
            '!.csscomb.json',
            '!.editorconfig',
            '!.jshintrc',
            '!.tmp'
        ],
        dest: 'build'
    }
};

export const clean = () => del(['assets', 'build']);

export const css = () => {

    return gulp.src(paths.css.src)
        .pipe(gulpif(!PRODUCTION, sourcemaps.init()))
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({cascade: false}))
        .pipe(gulpif(PRODUCTION, cleanCss({compatibility: 'ie8'})))
        .pipe(gulpif(!PRODUCTION, sourcemaps.write()))
        .pipe(gulp.dest(paths.css.dest))
        .pipe(server.stream());
};

export const js = () => {
    return gulp.src(paths.js.src)
        .pipe(named())
        .pipe(webpack({
            mode: PRODUCTION ? 'production' : 'development',
            externals: {
                "react": "React",
                "react-dom": "ReactDOM"
            },
            module: {
                rules: [
                    {
                        test: /\.scss$/i,
                        use: [
                            "style-loader",
                            {
                                loader: "css-loader",
                                options: {
                                    sourceMap: true,
                                    url: false,
                                }
                            },
                            "sass-loader",
                        ],
                    },
                    {
                        test: /\.js$/,
                        exclude: /(node_modules|bower_components)/,
                        use: [
                            {
                                loader: 'babel-loader',
                                options: {
                                    presets: ['@babel/preset-react'],
                                    plugins: ['@babel/plugin-proposal-class-properties'],
                                }
                            }
                        ]
                    },
                ]
            },
            plugins: [],
            optimization: {
                minimizer: [new TerserPlugin({
                    extractComments: false,
                })],
            },
            devtool: !PRODUCTION ? 'inline-source-map' : false
        }))
        .pipe(gulp.dest(paths.js.dest));
};

export const serve = done => {
    server.init({
        proxy: `musicpress.local`
    });

    done();
};

export const reload = done => {
    server.reload();
    done();
};

export const watch = () => {
    gulp.watch('src/scss/**/*.scss', css);
    gulp.watch(['src/js/**/*.js'], gulp.series(js, reload));
    gulp.watch('**/*.html', reload);
    gulp.watch(['src/images/**/*', 'src/vendor/**/*'], srcCopy);
};

export const srcCopy = () => {
   return  gulp.src(['src/**/*', '!src/{scss,js}', '!src/{scss,js}/**/*'])
       .pipe(gulp.dest('assets'));
}

export const compress = () => {
    return gulp.src(paths.build.src)
        .pipe(zip(`${pkg.name}.zip`))
        .pipe(gulp.dest(paths.build.dest));
};


export const dev = gulp.series(clean, gulp.parallel(css, js), srcCopy, serve, watch);
export const build = gulp.series(clean, gulp.parallel(css, js), srcCopy, compress);

export default dev;