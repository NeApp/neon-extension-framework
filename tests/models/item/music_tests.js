import {Artist, Album, Track} from '../../../src/models/item/music';


describe('Artist', function() {
    describe('construct', function() {
        it('instance', function() {
            let item = new Artist();

            // Ensure title is defined
            expect(item.title).toBe(null);
        });

        it('with values', function() {
            let item = new Artist({
                title: 'Gorillaz'
            });

            // Ensure title is defined
            expect(item.title).toBe('Gorillaz');
            expect(item.get('test').title).toBe('Gorillaz');
        });
    });

    describe('create', function() {
        it('instance', function() {
            let item = Artist.create('test');

            // Ensure title is defined
            expect(item.title).toBe(null);
        });

        it('with values', function() {
            let item = Artist.create('test', {
                title: 'Gorillaz'
            });

            // Ensure title is defined
            expect(item.title).toBe('Gorillaz');
            expect(item.get('test').title).toBe('Gorillaz');
        });

        it('with identifiers', function() {
            let item = Artist.create('test', {
                keys: {
                    id: 53
                },

                title: 'Gorillaz'
            });

            // Ensure identifier is defined
            expect(item.keys.test.id).toBe(53);
            expect(item.get('test').keys.id).toBe(53);
        });

        it('validates the "source" parameter', function() {
            expect(function() {
                Artist.create(5)
            }).toThrow(
                new Error('Invalid value provided for the "source" parameter (expected string)')
            );
        });
    });
});

describe('Album', function() {
    let artist = Artist.create('test', {
        title: 'Gorillaz'
    });

    describe('construct', function() {
        it('instance', function() {
            let item = new Album();

            // Ensure title is null
            expect(item.title).toBe(null);

            // Ensure artist is null
            expect(item.artist).toBe(null);
        });

        it('with values', function() {
            let item = new Album({
                title: 'Humanz'
            });

            // Ensure title is defined
            expect(item.title).toBe('Humanz');
            expect(item.get('test').title).toBe('Humanz');

            // Ensure artist is null
            expect(item.artist).toBe(null);
        });

        it('with children', function() {
            let item = new Album({
                title: 'Humanz'
            }, {
                artist
            });

            // Ensure title is defined
            expect(item.title).toBe('Humanz');
            expect(item.get('test').title).toBe('Humanz');

            // Ensure artist title is defined
            expect(item.artist.title).toBe('Gorillaz');
            expect(item.artist.values.title).toBe('Gorillaz');
            expect(item.artist.get('test').title).toBe('Gorillaz');
        });
    });

    describe('create', function() {
        it('instance', function() {
            let item = Album.create('test');

            // Ensure title is null
            expect(item.title).toBe(null);

            // Ensure artist is null
            expect(item.artist).toBe(null);
        });

        it('with values', function() {
            let item = Album.create('test', {
                title: 'Humanz'
            });

            // Ensure title is defined
            expect(item.title).toBe('Humanz');
            expect(item.get('test').title).toBe('Humanz');

            // Ensure artist is null
            expect(item.artist).toBe(null);
        });

        it('with children', function() {
            let item = Album.create('test', {
                title: 'Humanz'
            }, {
                artist
            });

            // Ensure title is defined
            expect(item.title).toBe('Humanz');
            expect(item.get('test').title).toBe('Humanz');

            // Ensure artist title is defined
            expect(item.artist.title).toBe('Gorillaz');
            expect(item.artist.values.title).toBe('Gorillaz');
            expect(item.artist.get('test').title).toBe('Gorillaz');
        });

        it('validates the "source" parameter', function() {
            expect(function() {
                Album.create(5)
            }).toThrow(
                new Error('Invalid value provided for the "source" parameter (expected string)')
            );
        });
    });
});

describe('Track', function() {
    let artist = Artist.create('test', {
        title: 'Gorillaz'
    });

    let album = Album.create('test', {
        title: 'Humanz'
    }, {
        artist
    });

    describe('construct', function() {
        it('instance', function() {
            let item = new Track();

            // Ensure values are null
            expect(item.title).toBe(null);
            expect(item.number).toBe(null);
            expect(item.duration).toBe(null);

            // Ensure children are null
            expect(item.album).toBe(null);
            expect(item.artist).toBe(null);
        });

        it('with values', function() {
            let item = new Track({
                title: 'Andromeda (feat. D.R.A.M.)',

                number: 10,
                duration: 198000
            });

            // Ensure title is defined
            expect(item.title).toBe('Andromeda (feat. D.R.A.M.)');
            expect(item.get('test').title).toBe('Andromeda (feat. D.R.A.M.)');

            // Ensure number is defined
            expect(item.number).toBe(10);
            expect(item.get('test').number).toBe(10);

            // Ensure duration is defined
            expect(item.duration).toBe(198000);
            expect(item.get('test').duration).toBe(198000);

            // Ensure children are null
            expect(item.album).toBe(null);
            expect(item.artist).toBe(null);
        });

        it('with children', function() {
            let item = new Track({
                title: 'Andromeda (feat. D.R.A.M.)',

                number: 10,
                duration: 198000
            }, {
                artist,
                album
            });

            // Ensure title is defined
            expect(item.title).toBe('Andromeda (feat. D.R.A.M.)');
            expect(item.get('test').title).toBe('Andromeda (feat. D.R.A.M.)');

            // Ensure number is defined
            expect(item.number).toBe(10);
            expect(item.get('test').number).toBe(10);

            // Ensure duration is defined
            expect(item.duration).toBe(198000);
            expect(item.get('test').duration).toBe(198000);

            // Ensure album title is defined
            expect(item.album.title).toBe('Humanz');
            expect(item.album.values.title).toBe('Humanz');
            expect(item.album.get('test').title).toBe('Humanz');

            // Ensure album artist title is defined
            expect(item.album.artist.title).toBe('Gorillaz');
            expect(item.album.artist.values.title).toBe('Gorillaz');
            expect(item.album.artist.get('test').title).toBe('Gorillaz');

            // Ensure artist title is defined
            expect(item.artist.title).toBe('Gorillaz');
            expect(item.artist.values.title).toBe('Gorillaz');
            expect(item.artist.get('test').title).toBe('Gorillaz');
        });
    });

    describe('create', function() {
        it('instance', function() {
            let item = Track.create('test');

            // Ensure values are null
            expect(item.title).toBe(null);
            expect(item.number).toBe(null);
            expect(item.duration).toBe(null);

            // Ensure children are null
            expect(item.album).toBe(null);
            expect(item.artist).toBe(null);
        });

        it('with values', function() {
            let item = Track.create('test', {
                title: 'Andromeda (feat. D.R.A.M.)',

                number: 10,
                duration: 198000
            });

            // Ensure title is defined
            expect(item.title).toBe('Andromeda (feat. D.R.A.M.)');
            expect(item.get('test').title).toBe('Andromeda (feat. D.R.A.M.)');

            // Ensure number is defined
            expect(item.number).toBe(10);
            expect(item.get('test').number).toBe(10);

            // Ensure duration is defined
            expect(item.duration).toBe(198000);
            expect(item.get('test').duration).toBe(198000);

            // Ensure children are null
            expect(item.album).toBe(null);
            expect(item.artist).toBe(null);
        });

        it('with children', function() {
            let item = Track.create('test', {
                title: 'Andromeda (feat. D.R.A.M.)',

                number: 10,
                duration: 198000
            }, {
                artist,
                album
            });

            // Ensure title is defined
            expect(item.title).toBe('Andromeda (feat. D.R.A.M.)');
            expect(item.get('test').title).toBe('Andromeda (feat. D.R.A.M.)');

            // Ensure number is defined
            expect(item.number).toBe(10);
            expect(item.get('test').number).toBe(10);

            // Ensure duration is defined
            expect(item.duration).toBe(198000);
            expect(item.get('test').duration).toBe(198000);

            // Ensure album title is defined
            expect(item.album.title).toBe('Humanz');
            expect(item.album.values.title).toBe('Humanz');
            expect(item.album.get('test').title).toBe('Humanz');

            // Ensure album artist title is defined
            expect(item.album.artist.title).toBe('Gorillaz');
            expect(item.album.artist.values.title).toBe('Gorillaz');
            expect(item.album.artist.get('test').title).toBe('Gorillaz');

            // Ensure artist title is defined
            expect(item.artist.title).toBe('Gorillaz');
            expect(item.artist.values.title).toBe('Gorillaz');
            expect(item.artist.get('test').title).toBe('Gorillaz');
        });

        it('validates the "source" parameter', function() {
            expect(function() {
                Track.create(5)
            }).toThrow(
                new Error('Invalid value provided for the "source" parameter (expected string)')
            );
        });
    });
});