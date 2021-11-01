;var Files = (function (Files) {
  Files.getPackageDirectory = () => new Promise(resolve => chrome.runtime.getPackageDirectoryEntry(resolve));
  Files.getDirectoryEntry = (dir, name) => new Promise(resolve => dir.getDirectory(name, {}, resolve));

  Files.getEntriesAndDir = async function (dir, relativePath = "") {
    var entries = [];

    const readDirReader = (dirReader) => new Promise(accept => dirReader.readEntries(accept));
    const fileEntryGetFile = (fileEntry) => new Promise(accept => fileEntry.file(accept));

    var dirReader = dir.createReader();

    console.log(`getEntriesAndDir: ${dir}`);

    while (1) {
      var newEntries = await readDirReader(dirReader);
      if (!newEntries || !newEntries.length)
        break;
      console.log(`getEntriesAndDir: newEntries`, newEntries);
      for (var f of newEntries) {
        if (f.name.startsWith("."))
          continue;
        f = await fileEntryGetFile(f);
        f.relative = relativePath + f.name;
        entries.push(f);
      }
    }

    console.log(`getEntriesAndDir: dir`, dir);
    console.log(`getEntriesAndDir: entries`, entries);
    return([dir, entries]);
  };

  Files.iterateEntriesAndDir = async function (dir, relativePath = "") {
    var files = [];

    for await (let [name, handle] of dir.entries()) {
      var file = await handle.getFile();
      files.push(file);
    }

    files = files.map(f => { f.relative = relativePath + f.name; return f });
    console.log(`iterateEntriesAndDir: dir`, dir);
    console.log(`iterateEntriesAndDir: files`, files);
    return [dir, files];
  };

  Files.getEntries = (dir, relativePath) => Files.getEntriesAndDir(dir, relativePath).then(([dir, entries]) => entries);

  Files.getRecursiveAndDir = function (dir, relativePath = "") {
    return Files.getEntries(dir, relativePath)
                .then(entries => Promise.all(entries.map(entry => entry.isDirectory ? Files.getRecursiveAndDir(entry, entry.relative + "/") : entry)))
                .then(entries => [dir, entries]);
  }

  Files.getEntriesRecursive = (dir, relativePath) => Files.getRecursiveAndDir(dir, relativePath).then(([dir, entries]) => entries);

  Files.makeObjFromEntries = (entries, obj = new Object()) => { 
    entries.forEach(e => { 
      if (e instanceof Array) { 
        obj[e[0].name] = Files.makeObjFromEntries(e[1]);
      } else { 
        obj[e.name] = e;
      } 
    }); 
    return obj; 
  };

  Files.getRecursiveAsObject = (dir, relativePath) => Files.getEntriesRecursive(dir, relativePath).then(Files.makeObjFromEntries);
  Files.getEntriesAsObject = (dir, relativePath) => Files.getEntries(dir, relativePath).then(Files.makeObjFromEntries);

  Files.getDirectoryFromPackageDirectory = (baseDir) => Files.getPackageDirectory().then(packageDir => Files.getDirectoryEntry(packageDir, baseDir));
  Files.getFileNamesFromPackageDirectory = (baseDir) => Files.getDirectoryFromPackageDirectory(baseDir).then(dir => Files.getEntries(dir, baseDir + '/')).then(e => e.map(f => f.relative));
  Files.getRecursiveAsObjectFromPackageDirectory = (baseDir) => Files.getDirectoryFromPackageDirectory(baseDir).then(dir => Files.getRecursiveAsObject(dir, baseDir + '/'));
  Files.getEntriesAsObjectFromPackageDirectory = (baseDir) => Files.getDirectoryFromPackageDirectory(baseDir).then(dir => Files.getEntriesAsObject(dir, baseDir + '/'));

  return Files
})(Files || {});
